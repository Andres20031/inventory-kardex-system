# Colección de Queries GraphQL — Sistema de Inventario y Kardex

> Todas las mutations (excepto `autenticarUsuario`) requieren el header:
> `Authorization: Bearer <token>`

---

## 1. AUTENTICACIÓN

### Login (obtener token)
```graphql
mutation Login {
  autenticarUsuario(input: {
    email: "admin@kardex.com"
    password: "admin123"
  }) {
    token
    usuario {
      id
      nombre
      email
      rol
    }
  }
}
```

### Crear usuario (solo admin)
```graphql
mutation CrearUsuario {
  crearUsuario(input: {
    nombre: "María López"
    email: "maria@empresa.com"
    password: "maria123"
    rol: "operador"
  }) {
    id
    nombre
    email
    rol
  }
}
```

### Ver usuario autenticado
```graphql
query Yo {
  yo {
    id
    nombre
    email
    rol
    activo
  }
}
```

---

## 2. PRODUCTOS

### Listar todos los productos (paginado)
```graphql
query ListarProductos {
  productos(pagina: 1, limite: 10, soloActivos: true) {
    productos {
      id
      codigo
      nombre
      categoria
      unidad
      stockActual
      stockMinimo
      precioCompra
      precioVenta
      precioPromedio
      bajoStock
      valorInventario
      activo
    }
    total
    paginas
    pagina
  }
}
```

### Buscar productos por nombre
```graphql
query BuscarProductos {
  productos(busqueda: "aceite", pagina: 1, limite: 10) {
    productos {
      id
      codigo
      nombre
      stockActual
      bajoStock
    }
    total
  }
}
```

### Filtrar por categoría
```graphql
query ProductosPorCategoria {
  productos(categoria: "Lubricantes", soloActivos: true) {
    productos {
      id
      codigo
      nombre
      stockActual
      precioVenta
    }
    total
  }
}
```

### Productos bajo stock mínimo
```graphql
query ProductosBajoStock {
  productos(bajoStock: true, soloActivos: true) {
    productos {
      id
      codigo
      nombre
      stockActual
      stockMinimo
      precioCompra
    }
    total
  }
}
```

### Ver un producto específico
```graphql
query VerProducto {
  producto(id: "ID_DEL_PRODUCTO") {
    id
    codigo
    nombre
    descripcion
    categoria
    unidad
    stockActual
    stockMinimo
    precioCompra
    precioVenta
    precioPromedio
    bajoStock
    valorInventario
    activo
    createdAt
    updatedAt
  }
}
```

### Listar categorías disponibles
```graphql
query Categorias {
  categorias
}
```

### Crear producto
```graphql
mutation CrearProducto {
  crearProducto(input: {
    codigo: "PROD010"
    nombre: "Filtro de Aire"
    descripcion: "Filtro de aire para motores de gasolina"
    categoria: "Filtros"
    unidad: "unidad"
    stockMinimo: 5
    precioCompra: 12000
    precioVenta: 20000
  }) {
    id
    codigo
    nombre
    stockActual
    bajoStock
  }
}
```

### Actualizar producto
```graphql
mutation ActualizarProducto {
  actualizarProducto(
    id: "ID_DEL_PRODUCTO"
    input: {
      nombre: "Filtro de Aire Premium"
      precioVenta: 22000
      stockMinimo: 8
    }
  ) {
    id
    codigo
    nombre
    precioVenta
    stockMinimo
  }
}
```

### Eliminar producto (soft delete — solo admin)
```graphql
mutation EliminarProducto {
  eliminarProducto(id: "ID_DEL_PRODUCTO")
}
```

### Restaurar producto eliminado (solo admin)
```graphql
mutation RestaurarProducto {
  restaurarProducto(id: "ID_DEL_PRODUCTO") {
    id
    codigo
    nombre
    activo
  }
}
```

---

## 3. MOVIMIENTOS (KARDEX)

### Registrar entrada de mercancía
```graphql
mutation RegistrarEntrada {
  crearMovimiento(input: {
    productoId: "ID_DEL_PRODUCTO"
    tipo: ENTRADA
    cantidad: 50
    precioUnitario: 15000
    observacion: "Compra a proveedor — Orden #OC-2024-001"
  }) {
    id
    tipo
    cantidad
    precioUnitario
    precioTotal
    stockAntes
    stockDespues
    producto {
      id
      nombre
      stockActual
      precioPromedio
    }
  }
}
```

### Registrar salida de mercancía
```graphql
mutation RegistrarSalida {
  crearMovimiento(input: {
    productoId: "ID_DEL_PRODUCTO"
    tipo: SALIDA
    cantidad: 5
    precioUnitario: 22000
    observacion: "Venta cliente — Factura #FAC-2024-001"
  }) {
    id
    tipo
    cantidad
    precioUnitario
    precioTotal
    stockAntes
    stockDespues
    producto {
      id
      nombre
      stockActual
    }
  }
}
```

### Listar todos los movimientos (paginado)
```graphql
query ListarMovimientos {
  movimientos(pagina: 1, limite: 20) {
    movimientos {
      id
      tipo
      cantidad
      precioUnitario
      precioTotal
      stockAntes
      stockDespues
      observacion
      createdAt
      producto {
        id
        codigo
        nombre
        unidad
      }
      usuario {
        id
        nombre
      }
    }
    total
    paginas
    pagina
  }
}
```

### Filtrar movimientos por tipo y fechas
```graphql
query MovimientosFiltrados {
  movimientos(
    tipo: "ENTRADA"
    fechaInicio: "2024-01-01"
    fechaFin: "2024-12-31"
    pagina: 1
    limite: 20
  ) {
    movimientos {
      id
      tipo
      cantidad
      precioTotal
      createdAt
      producto { nombre }
      usuario { nombre }
    }
    total
  }
}
```

### Kardex de un producto específico
```graphql
query KardexProducto {
  movimientosProducto(productoId: "ID_DEL_PRODUCTO") {
    id
    tipo
    cantidad
    precioUnitario
    precioTotal
    stockAntes
    stockDespues
    observacion
    createdAt
    usuario {
      id
      nombre
    }
  }
}
```

### Movimientos de un producto con filtros
```graphql
query MovimientosProductoFiltrado {
  movimientos(
    productoId: "ID_DEL_PRODUCTO"
    tipo: "SALIDA"
    fechaInicio: "2024-06-01"
    fechaFin: "2024-06-30"
  ) {
    movimientos {
      id
      tipo
      cantidad
      stockAntes
      stockDespues
      createdAt
    }
    total
  }
}
```

---

## 4. DASHBOARD Y REPORTES

### Estadísticas del dashboard
```graphql
query Dashboard {
  dashboardStats {
    totalProductos
    productosActivos
    productosBajoStock
    totalMovimientosHoy
    entradasHoy
    salidasHoy
    valorTotalInventario
  }
}
```

### Resumen mensual de movimientos (gráfico)
```graphql
query ResumenMensual {
  resumenMovimientosMensual {
    mes
    entradas
    salidas
  }
}
```

### Query completa del dashboard (una sola llamada)
```graphql
query DashboardCompleto {
  dashboardStats {
    totalProductos
    productosActivos
    productosBajoStock
    totalMovimientosHoy
    entradasHoy
    salidasHoy
    valorTotalInventario
  }
  resumenMovimientosMensual {
    mes
    entradas
    salidas
  }
}
```

---

## 5. NOTAS IMPORTANTES

### Tipos de movimiento válidos
- `ENTRADA` — incrementa el stock, recalcula precio promedio ponderado
- `SALIDA` — decrementa el stock (falla si no hay stock suficiente)

### Roles de usuario
- `admin` — acceso completo (crear usuarios, eliminar productos)
- `operador` — puede registrar movimientos y ver reportes, no puede eliminar

### Cómo usar el token en GraphQL Playground
En el panel "HTTP Headers" agrega:
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Fórmula del precio promedio ponderado
```
nuevoPrecioPromedio = (stockAnterior × precioPromedioActual + cantidadEntrada × precioNuevo) / nuevoStock
```