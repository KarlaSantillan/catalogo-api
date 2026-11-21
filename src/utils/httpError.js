// Error con código HTTP que el manejador central convierte en respuesta JSON.
class HttpError extends Error {
  constructor(status, codigo, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

module.exports = HttpError;
