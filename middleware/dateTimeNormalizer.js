/**
 * Middleware pour convertir automatiquement les formats simples
 * - start_date: "2025-01-15" → "2025-01-15T00:00:00.000Z"
 * - start_time: "09:30" → "1970-01-01T09:30:00.000Z"
 */
export const dateTimeNormalizer = (req, res, next) => {
    if (req.body) {
        
        // Convertir start_date (YYYY-MM-DD → ISO Date)
        if (req.body.start_date && typeof req.body.start_date === 'string') {
            if (req.body.start_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                req.body.start_date = req.body.start_date + 'T00:00:00.000Z'
            }
        }
        
        // Convertir start_time (HH:MM → ISO Time)
        if (req.body.start_time && typeof req.body.start_time === 'string') {
            if (req.body.start_time.match(/^\d{2}:\d{2}$/)) {
                req.body.start_time = `1970-01-01T${req.body.start_time}:00.000Z`
            }
        }
    }
    
    next()
} 