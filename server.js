const express = require('express');
const { MongoClient } = require('mongodb');
const axios = require('axios');

const app = express();
app.use(express.json());

// Tu URI de MongoDB Atlas (reemplaza con la tuya)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://...'; // Pégala aquí
// Tu API Key de OpenAI (reemplaza con la tuya)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'tu-api-key-aqui'; // Pégala aquí

app.post('/generar-anuncio', async (req, res) => {
  const { anfitrion_nombre, plato, descripcion, dia, precio, id_experiencia } = req.body;

  if (!anfitrion_nombre || !plato || !descripcion || !dia || !precio) {
    return res.status(400).json({ error: 'Faltan datos en la solicitud' });
  }

  const prompt = `Escribe un anuncio publicitario de 100 palabras para una experiencia culinaria casera en Bolivia. El anfitrión es ${anfitrion_nombre}, que cocina ${plato} (${descripcion}) el día ${dia}. El precio es ${precio} Bs. Hazlo atractivo, cultural y con un toque acogedor.`;

  try {
    const response = await axios.post('https://api.openai.com/v1/completions', {
      model: "gpt-3.5-turbo-instruct",
      prompt: prompt,
      max_tokens: 150,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const anuncio = response.data.choices[0].text.trim();

    // Conectar a MongoDB y guardar el anuncio
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('app'); // Cambia si tu base de datos tiene otro nombre
    const collection = db.collection('anuncios');

    await collection.insertOne({
      id_experiencia: id_experiencia || null,
      texto_anuncio: anuncio,
      fecha_creacion: new Date(),
      anfitrion_nombre,
      plato,
      dia,
      precio
    });

    await client.close();

    res.status(200).json({ message: 'Anuncio generado y guardado correctamente' });

  } catch (error) {
    console.error('Error al generar anuncio:', error.message);
    res.status(500).json({ error: 'Error interno al generar el anuncio' });
  }
});

app.get('/', (req, res) => {
  res.send('Servidor de generación de anuncios activo');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
