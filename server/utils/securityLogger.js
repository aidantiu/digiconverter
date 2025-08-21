const fs = require('fs');
const path = require('path');

class SecurityLogger {
    static logSecurityEvent(eventType, details, req = null) {
        const timestamp = new Date().toISOString();
        const clientIP = req ? (req.ip || req.connection.remoteAddress) : 'unknown';
        const userAgent = req ? req.get('User-Agent') : 'unknown';
        const userId = req && req.user ? req.user._id : 'anonymous';
        
        const logEntry = {
            timestamp,
            eventType,
            clientIP,
            userAgent,
            userId,
            details
        };
        
        // Log to console
        console.log(`🔒 SECURITY EVENT [${eventType}]:`, logEntry);
        
        // Log to file (implement file rotation in production)
        const logDir = path.join(__dirname, '../logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        const logFile = path.join(logDir, `security-${new Date().toISOString().split('T')[0]}.log`);
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    }
    
    static logAuthAttempt(success, email, req) {
        this.logSecurityEvent('AUTH_ATTEMPT', {
            success,
            email,
            timestamp: new Date().toISOString()
        }, req);
    }
    
    static logFileUpload(filename, fileSize, mimeType, req) {
        this.logSecurityEvent('FILE_UPLOAD', {
            filename,
            fileSize,
            mimeType,
            timestamp: new Date().toISOString()
        }, req);
    }
    
    static logSuspiciousActivity(activity, req) {
        this.logSecurityEvent('SUSPICIOUS_ACTIVITY', {
            activity,
            timestamp: new Date().toISOString()
        }, req);
    }
    
    static logAccessDenied(resource, reason, req) {
        this.logSecurityEvent('ACCESS_DENIED', {
            resource,
            reason,
            timestamp: new Date().toISOString()
        }, req);
    }
}

module.exports = SecurityLogger;