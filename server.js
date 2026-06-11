const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'responses.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize responses file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Endpoint to save response
app.post('/api/responses', (req, res) => {
    const newResponse = req.body;
    
    // Read current responses
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading data file:', err);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
        
        let responses = [];
        try {
            responses = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing data file:', parseError);
        }
        
        // Add timestamp
        newResponse.timestamp = new Date().toISOString();
        responses.push(newResponse);
        
        // Save back to file
        fs.writeFile(DATA_FILE, JSON.stringify(responses, null, 2), (err) => {
            if (err) {
                console.error('Error writing data file:', err);
                return res.status(500).json({ message: 'Error interno del servidor' });
            }
            
            res.status(200).json({ message: 'Respuesta guardada con éxito' });
        });
    });
});

// Endpoint to get all responses
app.get('/api/responses', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error leyendo respuestas' });
        }
        try {
            const responses = JSON.parse(data);
            res.status(200).json(responses);
        } catch (parseError) {
            res.status(500).json({ message: 'Error procesando respuestas' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
