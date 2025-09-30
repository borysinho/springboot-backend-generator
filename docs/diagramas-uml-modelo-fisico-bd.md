# Diagramas UML para Representar Modelos Físicos de Base de Datos

## Introducción

Los modelos físicos de base de datos representan la implementación concreta de un esquema de datos en un sistema de gestión de base de datos específico. UML proporciona varios diagramas que pueden utilizarse para representar estos modelos físicos, cada uno enfocándose en diferentes aspectos de la implementación.

## Diagrama de Clases - El Más Importante

### Uso Principal

El **diagrama de clases** es el diagrama UML más utilizado para representar modelos físicos de base de datos, ya que permite modelar directamente las estructuras de tablas, columnas y relaciones.

### Elementos para Modelo Físico

#### Representación de Tablas

```uml
+--------------------+
|      Customer      |
+--------------------+
| - customerID: int  |
| - name: varchar(50)|
| - email: varchar(100)|
| - createdAt: datetime|
+--------------------+
| + PK: customerID   |
| + UQ: email        |
+--------------------+
```

#### Representación de Relaciones

- **Asociación uno-a-muchos**: Línea con punto en el lado "uno"
- **Asociación muchos-a-muchos**: Asociación con tabla intermedia
- **Herencia/Generalización**: Triángulo apuntando a la superclase

#### Estereotipos Específicos para BD

```uml
<<Table>> Customer
<<Column>> customerID: int <<PK>>
<<Column>> name: varchar(50) <<NN>>
<<FK>> employerID -> Company.companyID
```

### Ejemplo Completo

```
+----------------+       +-----------------+
|   Customer     |       |    Account      |
+----------------+       +-----------------+
| - customerID   |<|----| - accountID     |
| - name         |       | - balance       |
| - email        |       | - customerID    |
+----------------+       +-----------------+
| PK: customerID |       | PK: accountID   |
| UQ: email      |       | FK: customerID |
+----------------+       +-----------------+
```

## Diagrama de Componentes

### Uso en Modelo Físico

El **diagrama de componentes** se utiliza para representar los componentes físicos de la base de datos, como archivos de datos, índices, triggers, stored procedures, etc.

### Elementos Representados

- **Componentes de datos**: Archivos de datos (.dbf, .mdf)
- **Índices**: Estructuras de indexación
- **Triggers**: Disparadores automáticos
- **Stored Procedures**: Procedimientos almacenados
- **Views**: Vistas materializadas

### Ejemplo

```
[Database Server]
    |
    +-- [Data Files]
    |   +-- customer_data.dbf
    |   +-- account_data.dbf
    |
    +-- [Index Files]
    |   +-- idx_customer_email
    |   +-- idx_account_customer
    |
    +-- [Stored Procedures]
        +-- sp_transfer_money
        +-- sp_calculate_balance
```

## Diagrama de Despliegue

### Uso en Modelo Físico

El **diagrama de despliegue** muestra cómo se distribuye físicamente la base de datos en la infraestructura de hardware y software.

### Elementos Representados

- **Nodos de base de datos**: Servidores físicos o virtuales
- **Instancias de BD**: Bases de datos específicas
- **Clusters**: Grupos de servidores para alta disponibilidad
- **Dispositivos de almacenamiento**: SAN, NAS, discos locales
- **Redes**: Conexiones entre componentes

### Ejemplo

```
[Web Server] ----> [Application Server] ----> [Database Server]
                                      |
                                      v
                               [Backup Server]
                                      |
                                      v
                            [Storage Area Network]
```

## Diagrama de Paquetes

### Uso en Modelo Físico

El **diagrama de paquetes** se utiliza para organizar el esquema de la base de datos en módulos lógicos y físicos, facilitando el mantenimiento y la evolución.

### Organización Típica

```
[Database Schema]
    |
    +-- [Core Tables]
    |   +-- Customer
    |   +-- Account
    |   +-- Transaction
    |
    +-- [Reference Tables]
    |   +-- Currency
    |   +-- AccountType
    |
    +-- [Audit Tables]
        +-- AuditLog
        +-- ChangeHistory
```

## Perfiles UML para Bases de Datos

### Perfil de Base de Datos UML

UML incluye un perfil específico para modelado de bases de datos que define estereotipos adicionales:

- `<<Table>>`: Para clases que representan tablas
- `<<Column>>`: Para atributos que representan columnas
- `<<PK>>`: Para claves primarias
- `<<FK>>`: Para claves foráneas
- `<<Index>>`: Para índices
- `<<Trigger>>`: Para triggers
- `<<View>>`: Para vistas

### Ejemplo con Perfiles

```uml
<<Table>> Customer
- <<Column>> customerID: int <<PK>>
- <<Column>> name: varchar(50) <<NN>>
- <<Column>> email: varchar(100) <<UQ>>
- <<Column>> createdAt: datetime <<NN>>

<<Table>> Account
- <<Column>> accountID: int <<PK>>
- <<Column>> balance: decimal(10,2) <<NN>>
- <<Column>> customerID: int <<FK>>
```

## Diagramas Adicionales de Soporte

### Diagrama de Secuencia

Útil para representar interacciones con la base de datos:

- Operaciones CRUD
- Transacciones complejas
- Llamadas a stored procedures

### Diagrama de Actividades

Para modelar procesos que involucran la base de datos:

- Flujos de trabajo de negocio
- Procesos ETL
- Operaciones de mantenimiento

### Diagrama de Estados

Para representar estados de entidades en la BD:

- Estados de registros (activo, inactivo, eliminado)
- Estados de transacciones (pendiente, procesada, cancelada)

## Mejores Prácticas

### 1. Consistencia entre Diagramas

- Mantener consistencia entre el diagrama de clases y los otros diagramas
- Usar los mismos nombres de elementos en todos los diagramas

### 2. Nivel de Detalle Apropiado

- Incluir solo información relevante para el modelo físico
- Evitar sobrecargar los diagramas con detalles de implementación

### 3. Documentación

- Usar notas para explicar restricciones complejas
- Documentar triggers y stored procedures importantes

### 4. Herramientas de Soporte

- Enterprise Architect
- Visual Paradigm
- IBM Rational Software Architect
- Herramientas CASE especializadas en BD

## Conclusión

Para representar un modelo físico de base de datos, el **diagrama de clases** es fundamental, complementado por **diagramas de componentes**, **despliegue** y **paquetes** según sea necesario. La combinación apropiada de estos diagramas proporciona una visión completa de la implementación física de la base de datos, desde el esquema lógico hasta la distribución en infraestructura.</content>
<parameter name="filePath">/home/bquiroga/Documents/dev/sw1/examen/joint-js/docs/diagramas-uml-modelo-fisico-bd.md
