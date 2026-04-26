export const typeDefs = `#graphql

  type Usuario {
    id: ID!
    nombre: String!
    email: String!
    rol: String!
    activo: Boolean!
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    usuario: Usuario!
  }

  type Producto {
    id: ID!
    codigo: String!
    nombre: String!
    descripcion: String
    categoria: String!
    unidad: String!
    stockActual: Float!
    stockMinimo: Float!
    precioCompra: Float!
    precioVenta: Float!
    precioPromedio: Float!
    imagen: String
    activo: Boolean!
    bajoStock: Boolean!
    valorInventario: Float!
    createdAt: String!
    updatedAt: String!
  }

  type Movimiento {
    id: ID!
    producto: Producto!
    tipo: String!
    cantidad: Float!
    precioUnitario: Float!
    precioTotal: Float!
    stockAntes: Float!
    stockDespues: Float!
    observacion: String
    usuario: Usuario!
    createdAt: String!
  }

  type PaginacionProductos {
    productos: [Producto!]!
    total: Int!
    paginas: Int!
    pagina: Int!
  }

  type PaginacionMovimientos {
    movimientos: [Movimiento!]!
    total: Int!
    paginas: Int!
    pagina: Int!
  }

  type DashboardStats {
    totalProductos: Int!
    productosActivos: Int!
    productosBajoStock: Int!
    totalMovimientosHoy: Int!
    entradasHoy: Int!
    salidasHoy: Int!
    valorTotalInventario: Float!
  }

  type ResumenMovimiento {
    mes: String!
    entradas: Int!
    salidas: Int!
  }

  # INPUTS
  input LoginInput {
    email: String!
    password: String!
  }

  input CrearUsuarioInput {
    nombre: String!
    email: String!
    password: String!
    rol: String
  }

  input CrearProductoInput {
    codigo: String!
    nombre: String!
    descripcion: String
    categoria: String!
    unidad: String
    stockMinimo: Float
    precioCompra: Float!
    precioVenta: Float!
    imagen: String
  }

  input ActualizarProductoInput {
    nombre: String
    descripcion: String
    categoria: String
    unidad: String
    stockMinimo: Float
    precioCompra: Float
    precioVenta: Float
    imagen: String
  }

  input CrearMovimientoInput {
    productoId: ID!
    tipo: String!
    cantidad: Float!
    precioUnitario: Float!
    observacion: String
  }

  # QUERIES
  type Query {
    # Usuarios
    yo: Usuario

    # Productos
    productos(
      busqueda: String
      categoria: String
      soloActivos: Boolean
      bajoStock: Boolean
      pagina: Int
      limite: Int
    ): PaginacionProductos!

    producto(id: ID!): Producto

    categorias: [String!]!

    # Movimientos
    movimientos(
      productoId: ID
      tipo: String
      fechaInicio: String
      fechaFin: String
      pagina: Int
      limite: Int
    ): PaginacionMovimientos!

    movimientosProducto(productoId: ID!): [Movimiento!]!

    # Dashboard y reportes
    dashboardStats: DashboardStats!
    resumenMovimientosMensual: [ResumenMovimiento!]!
  }

  # MUTATIONS
  type Mutation {
    # Auth
    autenticarUsuario(input: LoginInput!): AuthPayload!
    crearUsuario(input: CrearUsuarioInput!): Usuario!

    # Productos
    crearProducto(input: CrearProductoInput!): Producto!    
    actualizarProducto(id: ID!, input: ActualizarProductoInput!): Producto!
    eliminarProducto(id: ID!): Boolean!
    restaurarProducto(id: ID!): Producto!

    # Movimientos
    crearMovimiento(input: CrearMovimientoInput!): Movimiento!
  }
`;