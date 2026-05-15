/**
 * PostWarehouseWebPOS.groovy
 *
 * Dependencies:
 * - Misc/ExtractSLCredentials.groovy
 * - Misc/ODataConnection.groovy
 * - Misc/SOAPConnection.groovy
 * - Misc/LoggerService.groovy
 */

import com.sap.gateway.ip.core.customdev.util.Message
import java.net.URL
import java.net.HttpURLConnection
import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import javax.net.ssl.HttpsURLConnection
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager
import javax.net.ssl.HostnameVerifier
import javax.net.ssl.SSLSession
import java.security.cert.X509Certificate
import groovy.xml.XmlUtil
import com.sap.it.api.ITApiFactory
import com.sap.it.api.securestore.SecureStoreService


class Constants {
    static final String STEP_NAME = "PostWarehouseWebPOS"
    static final String W3P_CRED = "ITGWEPOSSAPINTEGRATION_W3P_CREDS"
    static final String W3P_URL = "ITGWEPOSSAPINTEGRATION_WEBPOS_URL"
    static final String WEBPOS_ACTION = "SAVE_WAREHOUSE"

    // For logging
    static final String LOG_RECID = "W3P"

    // Uncomment if need to use SAP endpoints
    // static final String SESSION_VAR_PROP_NAME = "[B1SESSION]"
    // static final String BASE_URL_PROP_NAME = "[SL_BaseURL]"
}


def Message processData(Message message) { 
    if (processBranchStatus(message)) return message
    
    def logger = new LoggerService(messageLogFactory, message)
    try { 
        logger.injectW3PCredentials() 
    } catch (Exception e) { 
        logger.logInternal(new LogRequest(stepName: "${Constants.STEP_NAME}_LOGGER_FAILURE", title: Constants.LOG_RECID, status: "ERROR", inputPayload: 'Nothing yet.', outputPayload: "LoggerService failed: ${e.message}"))
        message.setProperty("BRANCH_STATUS", 'ERROR')   // If branch status ERROR, terminate branch right away on next processes
        return message
    }

    def payload = ''
    def reader = message.getBody(java.io.Reader)
    if (reader != null) {
        try { payload = reader.getText() ?: '' } finally { try { reader.close() } catch (e) {} }
    } else {
        payload = (message.getBody(java.lang.String) ?: '')
    }

    def _p = payload?.toString()?.trim()
    if (!_p || _p == '[]' || _p == 'null' || _p == '') {
        logger.logBoth(new LogRequest(stepName: "${Constants.STEP_NAME}_SKIP", title: Constants.LOG_RECID, status: "OK", inputPayload: payload, outputPayload: "Mapping payload is empty. Skipping POST Requests"))
        return message
    }

    try {
        def w3pCredsResp = extractW3PCredentials()
        if (w3pCredsResp?.status != 1) {
            logger.logBoth(new LogRequest(stepName: "${Constants.STEP_NAME}_CREDS_FAILURE", title: Constants.LOG_RECID, status: "ERROR", inputPayload: '', outputPayload: "W3P Credentials not set: ${w3pCredsResp?.message ?: ''}"))
            message.setProperty("BRANCH_STATUS", 'ERROR')
            return message
        }
        def w3pCreds = [id: w3pCredsResp.id, key: w3pCredsResp.key, baseUrl: w3pCredsResp.baseUrl]

        // Extract <record>...</record> fragments from payload and post each record
        def records = []
        def matcher = (payload =~ /(?s)<record>.*?<\/record>/)
        matcher.each { m -> records << m }

        if (!records) {
            logger.logBoth(new LogRequest(stepName: "${Constants.STEP_NAME}_NO_RECORDS", title: Constants.LOG_RECID, status: "OK", inputPayload: payload, outputPayload: "No <record> fragments found"))
            message.setProperty("BRANCH_STATUS", 'ERROR')
            return message
        }

        def successes = []
        def errors = []
        for (rec in records) {
            try {
                def built = buildWebPOSRequest(rec, w3pCreds)
                if (built?.status != 1) {
                    errors << built
                    continue
                }

                def conn = new HTTPSOAPConnection(w3pCreds.baseUrl).setId(w3pCreds.id).setKey(w3pCreds.key)
                def soapReq = new SOAPRequestBody(action: Constants.WEBPOS_ACTION, customEnvelope: built.payload)
                def postRes = conn.post(soapReq)

                // If HTTP layer returned success, attempt to parse the inner Result payload
                if (postRes?.status == 1) {
                    def parsed = extractPostResult(postRes.payload, "fthirdpartyid")
                    if (parsed?.status == 1) {
                        successes << [status: 1, message: 'Success', payload: parsed.payload]
                    } else {
                        // parsed.status == 0 indicates business/client errors in the response
                        errors << [status: parsed?.status ?: 0, message: parsed?.message ?: 'Parsed Result indicates error', payload: parsed?.payload]
                    }
                } else {
                    // HTTP/connection-level failure: try to extract any Result details if available
                    def parsedErr = null
                    try { parsedErr = extractPostResult(postRes?.payload, "fthirdpartyid") } catch (e) { parsedErr = null }
                    if (parsedErr && parsedErr?.status != 1) {
                        errors << [status: parsedErr.status, message: parsedErr.message, payload: parsedErr.payload]
                    } else {
                        errors << [status: postRes?.status ?: -1, message: postRes?.message ?: 'HTTP/connection error', payload: postRes?.payload ?: postRes]
                    }
                }
            } catch (Exception e) {
                logger.logBoth(new LogRequest(stepName: "${Constants.STEP_NAME}_UNEXPECTED_ERR", title: Constants.LOG_RECID, status: "ERROR", inputPayload: rec, outputPayload: "Exception: ${e.message}"))
                errors << [status: -1, message: e.message]
            }
        }

        // Only log successes/errors when non-empty
        if (successes && successes.size() > 0) {
            try {
                def prettySuccess = JsonOutput.prettyPrint(JsonOutput.toJson(successes))
                logger.logBoth(new LogRequest(stepName: "${Constants.STEP_NAME}_OK", title: Constants.LOG_RECID, status: "OK", inputPayload: '', outputPayload: prettySuccess))
            } catch (Exception e) {
                logger.logBoth(new LogRequest(stepName: "${Constants.STEP_NAME}_OK", title: Constants.LOG_RECID, status: "OK", inputPayload: '', outputPayload: JsonOutput.toJson(successes)))
            }
        }

        if (errors && errors.size() > 0) {
            try {
                def prettyErrors = JsonOutput.prettyPrint(JsonOutput.toJson(errors))
                logger.logBoth(new LogRequest(stepName: "${Constants.STEP_NAME}_ERRORS", title: Constants.LOG_RECID, status: "ERROR", inputPayload: '', outputPayload: prettyErrors))
            } catch (Exception e) {
                logger.logBoth(new LogRequest(stepName: "${Constants.STEP_NAME}_ERRORS", title: Constants.LOG_RECID, status: "ERROR", inputPayload: '', outputPayload: JsonOutput.toJson(errors)))
            }
            message.setProperty("BRANCH_STATUS", 'ERROR')
        }

        message.setBody([])
    } catch (Exception e) {
        logger.logBoth(new LogRequest(title: Constants.LOG_RECID, stepName: "${Constants.STEP_NAME}_UNHANDLED_ERR", status: "ERROR", inputPayload: payload, outputPayload: "Exception: ${e.message}\nStacktrace: ${e.stackTrace.join('\n')}"))
        message.setProperty("BRANCH_STATUS", 'ERROR')
    }
    return message
}


















/**************************************
 * HELPER METHODS
 *************************************/


def boolean processBranchStatus(def message) {
    if (message == null) return true
    if (message.getProperty('BRANCH_STATUS') == 'ERROR') {
        return true
    }
    return false
}

/**
 * summary: Extract result details from a SOAP post response envelope
 * params:
 *  - soapResponse: String SOAP envelope returned by the WebPOS endpoint
 * description: Parses the SOAP envelope, extracts the inner `<Result>` XML,
 *              unescapes it, and returns structured details including `return_code`,
 *              per-record `id`/`result` and any `errors` (parenthetical dumps removed).
 * example: extractPostResult(soapResponse) -> [status:1,message:'Success',payload:[return_code:0,records:[...]]]
 */
def extractPostResult(def soapResponse, String idField) {
    try {
        if (!soapResponse) {
            return [status: -1, message: "Empty SOAP response", payload: null]
        }

        // Attempt to locate the <Result> element content (may be namespaced)
        def matcher = (soapResponse =~ /<Result[^>]*>([\s\S]*?)<\/Result>/)
        def resultEscaped = matcher ? (matcher[0][1]) : null
        if (!resultEscaped) {
            // fallback: try XmlSlurper to find element by local name
            try {
                def root = new XmlSlurper(false, false).parseText(soapResponse)
                def found = root.'**'.find { it.name() == 'Result' }
                resultEscaped = found?.text()
            } catch (e) {
                return [status: -1, message: "Unable to locate <Result> element: ${e.message}", payload: null]
            }
        }

        if (!resultEscaped) return [status: -1, message: "No <Result> content found", payload: null]

        // Basic XML unescape (handle nested ampersands first)
        def unescaped = resultEscaped.replaceAll('&amp;', '&')
                                    .replaceAll('&lt;', '<')
                                    .replaceAll('&gt;', '>')
                                    .replaceAll('&quot;', '"')
                                    .replaceAll('&apos;', "'")

        def inner
        try {
            inner = new XmlSlurper(false, false).parseText(unescaped)
        } catch (e) {
            return [status: -1, message: "Failed parsing inner Result XML: ${e.message}", payload: null]
        }

        def rc = inner.return_code?.text()?.trim()
        def records = []
        inner.data?.record?.each { r ->
            def rec = [:]
            rec.id = r.@id?.toString()
            rec.result = r.@result?.toString()
            def idVal = r."${idField}"?.text()
            rec[idField] = idVal
            // if the chosen idField is missing or empty, record an error
            if (!idVal) {
                // add a missing-id marker as an error entry
                rec.errors = ["Missing required field '${idField}' in response"]
                records << rec
                return
            }
            // collect errors (if any) and remove parenthetical Array(...) dumps
            def errs = []
            r.errors?.error?.each { e ->
                def s = e?.text() ?: ''
                s = s.replaceAll(/(?s)Array\s*\([^)]*\)/, '') // remove "Array(...)" blocks
                errs << s.trim()
            }
            // merge any previously added missing-id errors with actual errors
            rec.errors = (rec.errors ?: []) + errs
            records << rec
        }

        def hasError = records.any { (it.result?.toUpperCase() == 'ERROR') || (it.errors && it.errors.size() > 0) }
        def status = hasError ? 0 : 1
        def message = hasError ? 'ERROR' : 'Success'
        return [status: status, message: message, payload: [return_code: rc, records: records]]
    } catch (Exception e) {
        return [status: -1, message: "extractPostResult exception: ${e.message}", payload: null]
    }
}

/**
 * summary: Produce the inner `<data>` payload for a WebPOS SOAP call
 * params:
 *  - recordXml: String containing one or more `<record>...</record>` fragments
 * description: Validates provided W3P credential map and returns the raw
 * `dataContent` that should be placed inside the SOAP `<data>` element. This
 * function deliberately does NOT build the full SOAP envelope — callers should
 * pass the returned `dataContent` to `HTTPSOAPConnection` (via
 * `SOAPRequestBody.customEnvelope`) so the connection layer will wrap it.
 * example: buildWebPOSRequest("<record>...</record>") -> "<record>...</record>"
 */
def buildWebPOSRequest(def recordXml, Map w3pCreds = null) {
    try {
        if (!w3pCreds?.id || !w3pCreds?.key) {
            return [status: 0, message: 'W3P credentials incomplete (id/key required)', payload: null]
        }

        def dataContent = (recordXml != null) ? recordXml.toString() : ''

        return [status: 1, message: 'Success', payload: dataContent]
    } catch (Exception e) {
        return [status: -1, message: "Error preparing data content: ${e.message}", payload: null]
    }
}


/**
 * LoggerService.groovy
 * 
/*
** This service handles dual-layered logging for SAP Cloud Integration (iFlows).
** logInternal: Adds an attachment to the SAP Message Processing Log (MPL) for debugging in the SAP Monitor.
** logProcess: Sends a SOAP-structured log to an external service (W3P) for process tracking.
** logBoth: Executes both internal and process logging simultaneously.
*/


/**
 * Data Transfer Object (DTO) for structured logging.
 * Consolidates step information, status, and payload.
 */
class LogRequest {
    /** The name of the process step being logged */
    String stepName
    /** The title of the log entry / attachment */
    String title
    /** The status of the step (e.g., Success, Error, Info) */
    String status
    /** Input-related data for the log */
    Object inputPayload
    /** Output or response-related data for the log */
    Object outputPayload
    /** Optional media type for the internal attachment (default: text/plain) */
    String mediaType = "text/plain"
}

/**
 * Handles internal and process logging for SAP Cloud Integration.
 * 
 * Example usage:
 * LoggerService logger = new LoggerService(messageLogFactory, message)
 * logger.logInternal(new LogRequest(stepName: "Step1", title: "WAREHOUSE", status: "OK", inputPayload: "data"))
 * logger.logBoth("WAREHOUSE", "ProcessStep", "OK", input, output)
 */
class LoggerService {
    def messageLog
    def correlationId
    private String w3pId = null
    private String w3pKey = null
    private String w3pBaseUrl = null

    // Valid Log Statuses
    public static final List<String> VALID_STATUSES = ["OK", "ERROR"]

    // Valid Record IDs
    public static final List<String> VALID_RECORD_IDS = ["PRODUCT", "SALES", "INVENTORY", "ACCOUNT", "WAREHOUSE", "WEBHOOK", "W3P"]

    /**
     * Initializes the logger service.
     * @param messageLogFactory The global message log factory provided by the iFlow engine.
     * @param message The current iFlow Message object.
     */
    LoggerService(def messageLogFactory, Message message) {
        if (messageLogFactory != null) {
            this.messageLog = messageLogFactory.getMessageLog(message)
        }
        this.correlationId = message.getHeaders().get("SAP_MessageProcessingLogID") ?: "N/A"
    }

    /**
     * Adds an attachment to the SAP Message Processing Log (MPL).
     * Appends the Step Name to the payload content for better visibility.
     * @param request The LogRequest object containing all logging details.
     */
    def logInternal(LogRequest request) {
        if (this.messageLog != null) {
            String combinedPayload = ""
            if (request.inputPayload != null) combinedPayload += "Input:\n${request.inputPayload.toString()}\n\n"
            if (request.outputPayload != null) combinedPayload += "Output:\n${request.outputPayload.toString()}"
            
            if (combinedPayload) {
                String enrichedPayload = "Step: ${request.stepName}\nTitle: ${request.title ?: 'N/A'}\nStatus: ${request.status}\n\n${combinedPayload}"
                this.messageLog.addAttachmentAsString(request.stepName ?: request.title, enrichedPayload, request.mediaType)
            }
        }
    }

    /**
     * Triggers both internal and process (SOAP) logging.
     * @param request The LogRequest object containing internal logging details.
     */
    def logBoth(LogRequest request) {
        logInternal(request)
        logProcess(request)
    }

    /**
     * Executes process logging via SOAP if the connection is available.
     * @param request The LogRequest object containing internal logging details.
     * @return Map with status (1: success, 0: validation error, -1: system/server error), message, and payload.
     */
    def logProcess(LogRequest request) {
        if (w3pId == null || w3pBaseUrl == null || w3pKey == null) {
            return [status: 0, message: "Missing W3P Credentials. LogProcess cannot be used"]
        }

        // Validate Status
        String status = request.status?.toUpperCase()
        if (!(status in VALID_STATUSES)) {
            return [status: 0, message: "LoggerService: Invalid status '${status}'. Expected one of: ${VALID_STATUSES}"]
        }

        // Validate Record ID (derived from title)
        String recordId = request.title?.toUpperCase()
        if (!(recordId in VALID_RECORD_IDS)) {
            return [status: 0, message: "LoggerService: Invalid recordId '${recordId}' (derived from title). Expected one of: ${VALID_RECORD_IDS}"]
        }

        try {
            String dataContent = """
                    <fstatus_flag>${status}</fstatus_flag>
                    <frecordid>${recordId}</frecordid>
                    <finput_param>Step: ${request.stepName}\nTitle: ${request.title}\n\n${escapeXml(request.inputPayload)}</finput_param>
                    <foutput_param>${escapeXml(request.outputPayload)}</foutput_param>
            """.trim()
            String soapEnvelope = buildSoapEnvelope("POST_LOG", this.w3pId, this.w3pKey, dataContent)

            return postSoap(this.w3pBaseUrl, soapEnvelope)
        } catch (Exception e) {
            return [status: -1, message: "LoggerService: logProcess error: ${e.message}"]
        }
    }

    /**
     * Internal helper to escape XML special characters in payloads.
     */
    private String escapeXml(Object payload) {
        if (payload == null) return "null"
        return payload.toString()
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&apos;")
    }

    private def postSoap(String baseUrl, String soapEnvelope) {
        try {
            if (baseUrl == null || baseUrl == '') {
                return [status: -1, message: "Connection URL cannot be empty. Please set the baseUrl"]
            }

            HttpURLConnection con = (HttpURLConnection) new URL(baseUrl).openConnection()
            if (con instanceof HttpsURLConnection) {
                disableSSL()
            }

            try {
                con.setRequestMethod('POST')
                con.doOutput = true
                con.setRequestProperty('Content-Type', 'application/xml')
                con.outputStream.withCloseable { it << soapEnvelope }

                if (con.responseCode >= 200 && con.responseCode < 300) {
                    return [status: 1, message: "Success", payload: con.inputStream.text]
                }

                def errorText = con.errorStream?.text ?: "No error details provided"
                return [status: -1, message: "SOAP request failed to ${baseUrl}. HTTP ${con.responseCode}: $errorText"]
            } finally {
                con.disconnect()
            }
        } catch (Exception e) {
            return [status: -1, message: "SOAP exception: ${e.message}"]
        }
    }

    private String buildSoapEnvelope(String action, String id, String key, String dataContent) {
        return """<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
            <soapenv:Header/>
            <soapenv:Body>
                <call>
                    <action>${action}</action>
                    <params>
                        <id>
                            <fw3p_id>${id}</fw3p_id>
                            <fw3p_key>${key}</fw3p_key>
                        </id>
                        <data>
                            ${dataContent ?: ''}
                        </data>
                    </params>
                </call>
            </soapenv:Body>
        </soapenv:Envelope>
        """
    }

    private void disableSSL() {
        TrustManager[] trustAllCerts = [
            new X509TrustManager() {
                X509Certificate[] getAcceptedIssuers() { return null }
                void checkClientTrusted(X509Certificate[] certs, String authType) { }
                void checkServerTrusted(X509Certificate[] certs, String authType) { }
            }
        ] as TrustManager[]

        SSLContext sc = SSLContext.getInstance('TLS')
        sc.init(null, trustAllCerts, new java.security.SecureRandom())
        HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory())

        HttpsURLConnection.setDefaultHostnameVerifier(new HostnameVerifier() {
            boolean verify(String hostname, SSLSession session) { return true }
        })
    }

    /**
     * Internal helper to inject W3P credentials.
     * Defined inside the class to ensure it's accessible to class methods.
     * @return Map with credentials or error structure.
     */
    private def injectW3PCredentials() {
        def service = ITApiFactory.getService(SecureStoreService.class, null)
        if (service == null) {
            throw IllegalStateException("SecureStoreService is not available.")
        }

        // Extraction lambda/helper for internal use
        def getCreds = { String key ->
            def creds = service.getUserCredential(key)
            if (creds == null) {
                return null
            }
            return creds
        }

        def w3pCreds = getCreds(Constants.W3P_CRED)
        if (w3pCreds == null) throw IllegalStateException("Credential '${Constants.W3P_CRED}' not found in Security Material.")
        
        def w3pUrlCreds = getCreds(Constants.W3P_URL)
        if (w3pUrlCreds == null) throw IllegalStateException("Credential '${Constants.W3P_URL}' not found in Security Material.")

        // Set private instance variables; do NOT return credentials in the response
        this.w3pId = w3pCreds.getUsername()
        this.w3pKey = new String(w3pCreds.getPassword())
        this.w3pBaseUrl = new String(w3pUrlCreds.getPassword())

        return this
    }

}



/**
 * SOAPConnection.groovy
 * 
 * Dependencies:
 * - None
 */
/*
** Note that this is an HTTP Connection by default. For a more secure connection, please use HTTPS.
** This is only intended for testing.
*/

/**
 * Represents the configuration for an HTTP SOAP request.
 * Acts as a Data Transfer Object (DTO) to consolidate URL, payload, and headers.
 */
class SOAPRequestBody {
    /** The Map of parameters to be sent in the SOAP body */
    String action
    Map<String, Object> filters = [:]
    /** Optional XML string for the record/payload (used for POST/PUT) */
    String record = ""
    /** Optional full custom XML envelope string. If provided, default envelope building is bypassed. */
    String customEnvelope = ""

    /** Request headers (defaults to text/xml) */
    Map<String, String> requestProperty = [
        'Content-Type': 'application/xml'
    ]
}

class HTTPSOAPConnection {

    private String baseUrl
    private String id
    private String key

    public HTTPSOAPConnection(String baseUrl) {
        this.baseUrl = baseUrl
    }

    public def setId(String id) {
        this.id = id
        return this
    }

    public def setKey(String key) {
        this.key = key
        return this
    }

    public def setBaseUrl(String url) {
        this.baseUrl = url
        return this
    }

    private HttpURLConnection connect() {
        if (this.baseUrl == null || this.baseUrl == '') {
            return null
        }

        URL endpoint = new URL(this.baseUrl)
        HttpURLConnection connection = (HttpURLConnection) endpoint.openConnection()

        if (connection instanceof HttpsURLConnection) {
            disableSSL()
        }

        return connection
    }

    /**
     * Executes a SOAP POST request.
     * @param request The configuration object containing the XML action, credentials, and filters.
     * @return Result Map Structure.
     */
    public def post(SOAPRequestBody request) {
        try {
            def con = connect()
            if (con == null) {
                return [status: -1, message: "Connection URL cannot be empty. Please set the baseUrl"]
            }

            try {
                con.setRequestMethod('POST')
                con.doOutput = true
                
                for (prop in request.requestProperty) {
                    con.setRequestProperty(prop.key, prop.value)
                }

                String soapEnvelope = buildEnvelope(request)
                if (soapEnvelope instanceof Map) return soapEnvelope // Return validation error from buildEnvelope

                con.outputStream.withCloseable { it << soapEnvelope }

                if (con.responseCode >= 200 && con.responseCode < 300) {
                    return [status: 1, message: "Success", payload: con.inputStream.text]
                } else {
                    def errorText = con.errorStream?.text ?: "No error details provided"
                    return [status: -1, message: "SOAP request failed to ${this.baseUrl}. HTTP ${con.responseCode}: $errorText"]
                }
            } finally {
                con.disconnect()
            }
        } catch (Exception e) {
            return [status: -1, message: "SOAP exception: ${e.message}"]
        }
    }

    public def buildEnvelope(SOAPRequestBody request) {
        int provided = (request.customEnvelope ? 1 : 0) + (request.record ? 1 : 0) + (request.filters ? 1 : 0)
        if (provided > 1) {
            return [status: 0, message: "SOAPRequestBody: Only one of 'customEnvelope', 'record', or 'filters' can be provided."]
        }

        String dataContent = ""
        
        if (request.customEnvelope) {
            dataContent = request.customEnvelope
        } else if (request.record) {
            dataContent = "<record>${request.record}</record>"
        } else if (request.filters) {
            dataContent = """<filter>
                                ${request.filters.collect { k, v -> "<$k>$v</$k>" }.join('\n                         ')}
                            </filter>"""
        }

        return """<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
            <soapenv:Header/>
            <soapenv:Body>
                <call>
                    <action>${request.action}</action>
                    <params>
                        <id>
                            <fw3p_id>${this.id}</fw3p_id>
                            <fw3p_key>${this.key}</fw3p_key>
                        </id>
                        <data>
                            $dataContent
                        </data>
                    </params>
                </call>
            </soapenv:Body>
        </soapenv:Envelope>
        """
    }

    private void disableSSL() {
        TrustManager[] trustAllCerts = [
            new X509TrustManager() {
                X509Certificate[] getAcceptedIssuers() { return null }
                void checkClientTrusted(X509Certificate[] certs, String authType) { }
                void checkServerTrusted(X509Certificate[] certs, String authType) { }
            }
        ] as TrustManager[]

        SSLContext sc = SSLContext.getInstance('TLS')
        sc.init(null, trustAllCerts, new java.security.SecureRandom())
        HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory())

        HttpsURLConnection.setDefaultHostnameVerifier(new HostnameVerifier() {
            boolean verify(String hostname, SSLSession session) { return true }
        })
    }
}



/**
 * ODataConnection.groovy
 * 
 * Dependencies:
 * - None
 */
/*
** Note that this is an HTTP Connection by default. For a more secure connection, please use HTTPS.
** This is only intended for testing.
*/

/**
 * Represents the configuration for an HTTP OData request.
 * Acts as a Data Transfer Object (DTO) to consolidate URL, payload, and headers.
 */
class ODataRequestBody {

    /*
    **  The relative endpoint URL to be appended to the base URL 
    **  Note: Add filters to the url if needed (e.g. /Items?$filter=ItemCode%20eq%20'i001')
    */
    String url
    
    /** String of payload to be sent as body */
    String payload
    
    /** Request headers (defaults to application/json) */
    Map<String, String> requestProperty = [
        'Content-Type': 'application/json'
    ]
    
    /** Whether to automatically append the session cookie to the request */
    boolean isPassSession = true
}


class HTTPODataConnection {

    private String sessionCookie
    private String baseUrl
    private Object responseBody

    public HTTPODataConnection(String baseUrl) {
        this.baseUrl = baseUrl
    }

    public def setSessionCookie(String cookie) {
        this.sessionCookie = cookie
        return this
    }

    public def setBaseUrl(String url) {
        baseUrl = url
        return this
    }

    /**
     * Extracts the first element if the internal responseBody is a List, otherwise returns an empty Map.
     * Updates the internal reference to allow chaining.
     * @return the current instance for chaining.
     */
    public def parse() {
        if (this.responseBody instanceof List && !this.responseBody.isEmpty()) {
            this.responseBody = this.responseBody[0]
        } else if (this.responseBody instanceof Map && this.responseBody.value instanceof List) {
            this.responseBody = this.responseBody.value[0]
        }
        return this
    }

    /**
     * Converts the current internal responseBody to a JSON string.
     * @return A JSON formatted String.
     */
    public def toJson() {
        if (!this.responseBody) return "{}"
        return JsonOutput.toJson(this.responseBody)
    }

    /**
     * Returns the raw response body.
     */
    public Object getBody() {
        return this.responseBody
    }

    public HttpURLConnection connect(String url) {
        if (url == null || url == '') {
            return null
        }

        URL endpoint = new URL(baseUrl + url)
        HttpURLConnection connection = (HttpURLConnection) endpoint.openConnection()

        if (connection instanceof HttpsURLConnection) {
            disableSSL()
        }

        return connection
    }

    /**
     * Executes an HTTP GET request.
     * @param request The configuration object containing the URL and headers.
     * @return Result Map Structure.
     */
    public def get(ODataRequestBody request) {
        try {
            def con = connect(request.url)
            if (con == null) {
                return [status: -1, message: "Connection URL cannot be empty. Please set the baseUrl for this connection"]
            }
            con.setRequestMethod('GET')
            for (prop in request.requestProperty) {
                con.setRequestProperty(prop.key, prop.value)
            }

            if (request.isPassSession) {
                if (!sessionCookie) {
                    return [status: -1, message: "Missing sessionCookie for Connection"]
                }
                con.setRequestProperty('Cookie', sessionCookie)
            }

            if (request.payload) {
                con.doOutput = true
                con.outputStream.withCloseable { it << request.payload }
            }

            if (con.responseCode >= 200 && con.responseCode < 300) {
                def result = new JsonSlurper().parse(con.inputStream.newReader())
                return [status: 1, message: "Success", payload: result]
            } else {
                def errorText = con.errorStream?.text ?: "No error details provided"
                return [status: -1, message: "GET failed. HTTP ${con.responseCode}: $errorText"]
            }
        } catch (Exception e) {
            return [status: -1, message: "GET exception: ${e.message}"]
        }
    }

    /**
     * Executes an HTTP PUT request.
     * @param request The configuration object containing the URL, payload, and headers.
     * @return Result Map Structure.
     */
    public def put(ODataRequestBody request) {
        try {
            def con = connect(request.url)
            if (con == null) {
                return [status: -1, message: "Connection URL cannot be empty. Please set the baseUrl for this connection"]
            }
            con.setRequestMethod('PUT')
            con.doOutput = true
            for (prop in request.requestProperty) {
                con.setRequestProperty(prop.key, prop.value)
            }

            if (request.isPassSession) {
                if (!sessionCookie) {
                    return [status: -1, message: "Missing sessionCookie for Connection"]
                }
                con.setRequestProperty('Cookie', sessionCookie)
            }

            if (request.payload) {
                con.outputStream.withCloseable { it << request.payload }
            }

            if (con.responseCode >= 200 && con.responseCode < 300) {
                def result = new JsonSlurper().parse(con.inputStream.newReader())
                return [status: 1, message: "Success", payload: result]
            } else {
                def errorText = con.errorStream?.text ?: "No error details provided"
                return [status: -1, message: "PUT failed. HTTP ${con.responseCode}: $errorText"]
            }
        } catch (Exception e) {
            return [status: -1, message: "PUT exception: ${e.message}"]
        }
    }

    /**
     * Executes an HTTP PATCH request.
     * @param request The configuration object containing the URL, payload, and headers.
     * @return Result Map Structure.
     */
    public def patch(ODataRequestBody request) {
        try {
            def con = connect(request.url)
            if (con == null) {
                return [status: -1, message: "Connection URL cannot be empty. Please set the baseUrl for this connection"]
            }
            // Some Java runtimes (older HttpURLConnection) disallow the PATCH method
            // and will throw ProtocolException: "Invalid HTTP method: PATCH".
            // Try PATCH first; on ProtocolException, fall back to POST with
            // X-HTTP-Method-Override: PATCH which many servers accept.
            try {
                con.setRequestMethod('PATCH')
            } catch (java.net.ProtocolException pe) {
                con.setRequestMethod('POST')
                con.setRequestProperty('X-HTTP-Method-Override', 'PATCH')
            }
            con.doOutput = true
            for (prop in request.requestProperty) {
                con.setRequestProperty(prop.key, prop.value)
            }

            if (request.isPassSession) {
                if (!sessionCookie) {
                    return [status: -1, message: "Missing sessionCookie for Connection"]
                }
                con.setRequestProperty('Cookie', sessionCookie)
            }

            if (request.payload) {
                con.outputStream.withCloseable { it << request.payload }
            }

            if (con.responseCode >= 200 && con.responseCode < 300) {
                if (con.responseCode == 204) return [status: 1, message: "Success"]
                def result = new JsonSlurper().parse(con.inputStream.newReader())
                return [status: 1, message: "Success", payload: result]
            } else {
                def errorText = con.errorStream?.text ?: "No error details provided"
                return [status: -1, message: "PATCH failed. HTTP ${con.responseCode}: $errorText"]
            }
        } catch (Exception e) {
            return [status: -1, message: "PATCH exception: ${e.message}"]
        }
    }

    /**
     * Executes an HTTP DELETE request.
     * @param request The configuration object containing the URL and headers.
     * @return Result Map Structure.
     */
    public def delete(ODataRequestBody request) {
        try {
            def con = connect(request.url)
            if (con == null) {
                return [status: -1, message: "Connection URL cannot be empty. Please set the baseUrl for this connection"]
            }

            con.setRequestMethod('DELETE')
            for (prop in request.requestProperty) {
                con.setRequestProperty(prop.key, prop.value)
            }

            if (request.isPassSession) {
                if (!sessionCookie) {
                    return [status: -1, message: "Missing sessionCookie for Connection"]
                }
                con.setRequestProperty('Cookie', sessionCookie)
            }

            if (request.payload) {
                con.doOutput = true
                con.outputStream.withCloseable { it << request.payload }
            }

            if (con.responseCode >= 200 && con.responseCode < 300) {
                if (con.responseCode == 204) return [status: 1, message: "Success"]
                def result = new JsonSlurper().parse(con.inputStream.newReader())
                return [status: 1, message: "Success", payload: result]
            } else {
                def errorText = con.errorStream?.text ?: "No error details provided"
                return [status: -1, message: "DELETE failed. HTTP ${con.responseCode}: $errorText"]
            }
        } catch (Exception e) {
            return [status: -1, message: "DELETE exception: ${e.message}"]
        }
    }

    /**
     * Executes an HTTP POST request.
     * @param request The configuration object containing the URL, payload, and headers.
     * @return Result Map Structure.
     */
    public def post(ODataRequestBody request) {
        try {
            def con = connect(request.url)
            if (con == null) {
                return [status: -1, message: "Connection URL cannot be empty. Please set the baseUrl for this connection"]
            }
            
            con.setRequestMethod('POST')
            con.setDoOutput(true)
            for (prop in request.requestProperty) {
                con.setRequestProperty(prop.key, prop.value)
            }

            if (request.isPassSession) {
                if (!sessionCookie) {
                    return [status: -1, message: "Missing sessionCookie for Connection"]
                }
                con.setRequestProperty('Cookie', sessionCookie)
            }

            if (request.payload) {
                con.outputStream.withCloseable { it << request.payload }
            }

            int responseCode = con.responseCode
            if (responseCode >= 200 && responseCode < 300) {
                String contentType = con.getHeaderField("Content-Type")
                if (contentType && contentType.contains("multipart/mixed")) {
                    this.responseBody = con.inputStream.text
                } else {
                    this.responseBody = new JsonSlurper().parse(con.inputStream.newReader())
                }
                return [status: 1, message: "Success", payload: this.responseBody]
            } else {
                def errorText = con.errorStream?.text ?: "No error details provided"
                return [status: -1, message: "POST failed. HTTP $responseCode: $errorText"]
            }
        } catch (Exception e) {
            return [status: -1, message: "POST exception: ${e.message}"]
        }
    }

    private void disableSSL() {
        TrustManager[] trustAllCerts = [
            new X509TrustManager() {

            X509Certificate[] getAcceptedIssuers() { return null }
            void checkClientTrusted(X509Certificate[] certs, String authType) { }
            void checkServerTrusted(X509Certificate[] certs, String authType) { }

            }
        ] as TrustManager[]

        SSLContext sc = SSLContext.getInstance('TLS')
        sc.init(null, trustAllCerts, new java.security.SecureRandom())
        HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory())

        HttpsURLConnection.setDefaultHostnameVerifier(new HostnameVerifier() {

            boolean verify(String hostname, SSLSession session) {
                return true
            }

        })
    }
}



/**
 * ExtractSLCredentials.groovy
 * 
 * Dependencies:
 * - None
 */

/**
 * For extracting Service Layer credentials
 * Returns map with status/message and the values as named items (no `payload` key).
 * Example success: [status:1, message:'Success', sessionCookie: '...', baseUrl: '...']
 */
def extractSLCredentials(Message message) {
    String sessionCookie = message.getProperty(Constants.SESSION_VAR_PROP_NAME)
    String baseUrl = message.getProperty(Constants.BASE_URL_PROP_NAME)

    if (!sessionCookie) {
        return [status: -1, message: "SessionCookie is missing."]
    }
    if (!baseUrl) {
        return [status: -1, message: "BaseUrl is missing."]
    }

    return [status: 1, message: "Success", sessionCookie: sessionCookie, baseUrl: baseUrl]
}


/**
 * ExtractW3PCredentials.groovy
 * 
 * Dependencies:
 * - None
 */

/**
 * Logic to extract W3P credentials from the SAP Secure Store and map them to integration variables.
 * 
 * <p>Example usage in a main script:</p>
 * <pre>
 * {@code
 *  import com.sap.it.api.ITApiFactory
 *  import com.sap.it.api.securestore.SecureStoreService
 *
 *  def Message processData(Message message) {
 *      def credsMap = extractW3PCredentials()
 *
 *      message.setHeader("W3P_Id", credsMap.id)
 *      message.setHeader("W3P_Key", credsMap.key)
 *      message.setProperty("W3P_BaseUrl", credsMap.baseUrl)
 *
 *      return message
 *  }
 * }
 * </pre>
 */


/**
 * Method to extract W3P credentials from the SAP Secure Store.
 */
def extractW3PCredentials() {
    try {
        def service = ITApiFactory.getService(SecureStoreService.class, null)
        if (service == null) {
            return [status: -1, message: "SecureStoreService is not available."]
        }

        // Extraction lambda/helper for internal use
        def getCreds = { String key ->
            def creds = service.getUserCredential(key)
            if (creds == null) {
                return null
            }
            return creds
        }

        def w3pCreds = getCreds(Constants.W3P_CRED)
        if (w3pCreds == null) {
            return [status: -1, message: "Credential '${Constants.W3P_CRED}' not found in Security Material."]
        }

        def w3pUrlCreds = getCreds(Constants.W3P_URL)
        if (w3pUrlCreds == null) {
            return [status: -1, message: "Credential '${Constants.W3P_URL}' not found in Security Material."]
        }

        String id = w3pCreds.getUsername()
        String key = new String(w3pCreds.getPassword())
        String baseUrl = new String(w3pUrlCreds.getPassword())

        if (!id || !key || !baseUrl) {
            return [status: -1, message: "Missing W3P Configuration in Secure Store (${Constants.W3P_CRED}/${Constants.W3P_URL})."]
        }

        return [status: 1, message: "Success", id: id, key: key, baseUrl: baseUrl ]
    } catch (Exception e) {
        return [status: -1, message: "Error extracting credentials: ${e.message}"]
    }
}