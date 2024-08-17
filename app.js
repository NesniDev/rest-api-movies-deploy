const express = require('express')

const crypto = require('node:crypto') // id unicas
const moviesJSON = require('./movies.json')
const cors = require('cors')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()

const PORT = process.env.PORT ?? 1234

// middleware para parsear el body del request POST
app.use(express.json())

app.get('/', (req, res) => {
  res.send({ message: 'Hello World!' })
})

// Controlar el ERROR FIXME: CORS
// todos los origenes que no sena nuestro origen son permitidos para acceder
app.use(
  cors({
    origin: (origin, callback) => {
      const ACCEPTED_ORIGINS = [
        'http://localhost:8080',
        'http://localhost:1234',
        'https://movies.com',
        'https://midu.dev'
      ]

      if (ACCEPTED_ORIGINS.includes(origin)) {
        return callback(null, true)
      }

      if (!origin) {
        return callback(null, true)
      }

      return callback(new Error('Not allowed by CORS'))
    }
  })
)
app.disable('x-powered-by') // deshabilitar el header X-Powered-By: Express

// métodos normales: GET/HEAD/POST
// métodos complejos: PUT/PATCH/DELETE

// CORS PRE-Flight -> para los metodos POST/PUT/PATCH
// OPTIONS

// Todos los recursos que sean MOVIES se identifican con /movies
app.get('/movies', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*') //
  const { genre } = req.query
  if (genre) {
    const filterMovies = moviesJSON.filter((movie) =>
      movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
    )
    return res.json(filterMovies)
  }
  res.json(moviesJSON)
})

// Crear una movie

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)
  if (result.error) {
    // codestatus 400 bad request, el cliente ha hecho una petición incorrecta
    return res.status(400).json({ message: JSON.parse(result.error.message) })
  }

  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data
  }
  // esto no seria REST, por que estamos guardando el estado de la aplicación en memoria
  moviesJSON.push(newMovie)

  // indidcar que se ha creado el recurso
  res.status(201).json(newMovie)
})

// Eliminar los recursos que sean Movies por ID

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = moviesJSON.findIndex((movie) => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  moviesJSON.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

// Recuperar los recursos que sean Movies por ID
app.get('/movies/:id', (req, res) => {
  // path to regexp
  const { id } = req.params
  const movie = moviesJSON.find((movie) => movie.id === id)
  if (movie) return res.json(movie)

  res.status(404).json({ message: 'Movie not found' })
})

// Actualizar una parte de un movie con patch

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const movieIndex = moviesJSON.findIndex((movie) => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  const updateMovie = {
    ...moviesJSON[movieIndex],
    ...result.data
  }

  moviesJSON[movieIndex] = updateMovie

  return res.json(updateMovie)
})
// CORS POST-Flight -> para los metodos POST/PUT/PATCH

// app.options('/movies/:id', (req, res) => {
//   const origin = req.header('Origin')
//   if (ACCEPTED_ORIGINS.includes(origin)) {
//     res.header('Access-Control-Allow-Origin', '*')
//     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
//   }
//   res.send(200)
// })
app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`)
})
