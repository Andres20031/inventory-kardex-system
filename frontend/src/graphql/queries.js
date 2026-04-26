import { gql } from '@apollo/client';

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    autenticarUsuario(input: $input) {
      token
      usuario { id nombre email rol }
    }
  }
`;

export const CREAR_USUARIO = gql`
  mutation CrearUsuario($input: CrearUsuarioInput!) {
    crearUsuario(input: $input) { id nombre email rol }
  }
`;

// ── PRODUCTOS ─────────────────────────────────────────────────────────────────
export const GET_PRODUCTOS = gql`
  query GetProductos($busqueda: String, $categoria: String, $soloActivos: Boolean, $bajoStock: Boolean, $pagina: Int, $limite: Int) {
    productos(busqueda: $busqueda, categoria: $categoria, soloActivos: $soloActivos, bajoStock: $bajoStock, pagina: $pagina, limite: $limite) {
      productos {
        id codigo nombre categoria unidad stockActual stockMinimo
        precioCompra precioVenta precioPromedio bajoStock valorInventario activo
      }
      total paginas pagina
    }
  }
`;

export const GET_PRODUCTO = gql`
  query GetProducto($id: ID!) {
    producto(id: $id) {
      id codigo nombre descripcion categoria unidad
      stockActual stockMinimo precioCompra precioVenta precioPromedio
      bajoStock valorInventario activo createdAt updatedAt
    }
  }
`;

export const GET_CATEGORIAS = gql`
  query { categorias }
`;

export const CREAR_PRODUCTO = gql`
  mutation CrearProducto($input: CrearProductoInput!) {
    crearProducto(input: $input) {
      id codigo nombre categoria stockActual bajoStock
    }
  }
`;

export const ACTUALIZAR_PRODUCTO = gql`
  mutation ActualizarProducto($id: ID!, $input: ActualizarProductoInput!) {
    actualizarProducto(id: $id, input: $input) {
      id codigo nombre categoria stockActual bajoStock
    }
  }
`;

export const ELIMINAR_PRODUCTO = gql`
  mutation EliminarProducto($id: ID!) {
    eliminarProducto(id: $id)
  }
`;

// ── MOVIMIENTOS ───────────────────────────────────────────────────────────────
export const GET_MOVIMIENTOS = gql`
  query GetMovimientos($productoId: ID, $tipo: String, $fechaInicio: String, $fechaFin: String, $pagina: Int, $limite: Int) {
    movimientos(productoId: $productoId, tipo: $tipo, fechaInicio: $fechaInicio, fechaFin: $fechaFin, pagina: $pagina, limite: $limite) {
      movimientos {
        id tipo cantidad precioUnitario precioTotal stockAntes stockDespues observacion createdAt
        producto { id codigo nombre unidad }
        usuario { id nombre }
      }
      total paginas pagina
    }
  }
`;

export const GET_MOVIMIENTOS_PRODUCTO = gql`
  query GetMovimientosProducto($productoId: ID!) {
    movimientosProducto(productoId: $productoId) {
      id tipo cantidad precioUnitario precioTotal stockAntes stockDespues observacion createdAt
      usuario { id nombre }
    }
  }
`;

export const CREAR_MOVIMIENTO = gql`
  mutation CrearMovimiento($input: CrearMovimientoInput!) {
    crearMovimiento(input: $input) {
      id tipo cantidad stockAntes stockDespues
      producto { id nombre stockActual }
    }
  }
`;

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export const GET_DASHBOARD = gql`
  query GetDashboard {
    dashboardStats {
      totalProductos productosActivos productosBajoStock
      totalMovimientosHoy entradasHoy salidasHoy valorTotalInventario
    }
    resumenMovimientosMensual { mes entradas salidas }
  }
`;