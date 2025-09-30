# Transformación de Modelo Lógico a Modelo Físico usando OMT

## Introducción

La metodología OMT (Object Modeling Technique) de James Rumbaugh proporciona un enfoque sistemático para transformar modelos lógicos orientados a objetos en modelos físicos de bases de datos relacionales. Esta transformación es fundamental en el desarrollo de software, ya que permite mapear conceptos del mundo real representados en modelos UML a estructuras de datos persistentes eficientes.

## Conceptos Fundamentales

### Modelo Lógico vs Modelo Físico

- **Modelo Lógico**: Representa conceptos del dominio del problema usando clases, atributos, asociaciones y generalizaciones. Es independiente de la tecnología de implementación.
- **Modelo Físico**: Específica cómo se implementarán las estructuras lógicas en un sistema de base de datos particular, incluyendo tablas, índices, restricciones y optimizaciones de rendimiento.

## Reglas de Transformación Básica

### 1. Transformación de Clases

**Regla básica**: Cada clase del modelo lógico se mapea a una tabla en el modelo físico.

```sql
-- Modelo Lógico: Clase Customer
-- Atributos: customerID, name, tempAmount

CREATE TABLE Customer (
    customer_ID NUMBER(30) CONSTRAINT nn_customer1 NOT NULL,
    cust_name VARCHAR2(50) CONSTRAINT nn_customer2 NOT NULL,
    temp_amount NUMBER(12,2),
    CONSTRAINT pk_customer PRIMARY KEY (customer_ID)
);
```

**Consideraciones**:

- Cada atributo se convierte en una columna
- Se añade un identificador único (object identity)
- Se definen restricciones de no-nulidad apropiadas

### 2. Transformación de Asociaciones

#### Asociaciones Muchos-a-Muchos

**Regla**: Crear una tabla separada con claves foráneas a las tablas relacionadas.

```sql
-- Asociación muchos-a-muchos: Account *-* CardAuthorization
CREATE TABLE Acct_CardAuth (
    account_ID NUMBER(30) CONSTRAINT nn_acctca1 NOT NULL,
    card_auth_ID NUMBER(30) CONSTRAINT nn_acctca2 NOT NULL,
    CONSTRAINT pk_acctca PRIMARY KEY (account_ID, card_auth_ID)
);
```

#### Asociaciones Uno-a-Muchos

**Regla**: Incluir clave foránea en la tabla del lado "muchos".

```sql
-- Asociación uno-a-muchos: Customer 1-* Account
CREATE TABLE Account (
    account_ID NUMBER(30) CONSTRAINT nn_account1 NOT NULL,
    balance NUMBER(12,2) CONSTRAINT nn_account2 NOT NULL,
    credit_limit NUMBER(12,2),
    customer_ID NUMBER(30) CONSTRAINT nn_account3 NOT NULL,
    -- ... otros atributos
    CONSTRAINT pk_account PRIMARY KEY (account_ID),
    CONSTRAINT fk_account_customer FOREIGN KEY (customer_ID)
        REFERENCES Customer(customer_ID)
);
```

#### Asociaciones Uno-a-Uno

**Regla**: Incluir clave foránea en cualquiera de las dos tablas.

### 3. Transformación de Generalizaciones

#### Herencia Simple

**Regla**: Crear tabla separada para la superclase y cada subclase.

```sql
-- Generalización: Account <- CheckingAccount, SavingsAccount
CREATE TABLE Account (
    account_ID NUMBER(30) CONSTRAINT nn_account1 NOT NULL,
    balance NUMBER(12,2) CONSTRAINT nn_account2 NOT NULL,
    credit_limit NUMBER(12,2),
    account_type VARCHAR2(20) CONSTRAINT nn_account3 NOT NULL,
    CONSTRAINT pk_account PRIMARY KEY (account_ID),
    CONSTRAINT ck_account_type CHECK (account_type IN ('Checking_Account', 'Savings_Account'))
);

CREATE TABLE Checking_Account (
    chk_acct_ID NUMBER(30) CONSTRAINT nn_chkacct1 NOT NULL,
    protect_odrft VARCHAR2(1) CONSTRAINT nn_chkacct2 NOT NULL,
    CONSTRAINT pk_chkacct PRIMARY KEY (chk_acct_ID),
    CONSTRAINT fk_chkacct_account FOREIGN KEY (chk_acct_ID)
        REFERENCES Account(account_ID) ON DELETE CASCADE
);
```

### 4. Identidad de Objetos

#### Identidad Basada en Objetos (Recomendado)

**Regla**: Añadir identificador artificial único a cada tabla.

```sql
-- Cada tabla tiene su propio ID artificial
CREATE TABLE Customer (
    customer_ID NUMBER(30) PRIMARY KEY,  -- ID artificial
    name VARCHAR2(50) NOT NULL,
    -- ... otros atributos
);
```

#### Identidad Basada en Valores

**Regla**: Usar combinación de atributos del mundo real como clave primaria.

```sql
-- Usar atributos naturales como clave
CREATE TABLE Bank (
    name VARCHAR2(50) PRIMARY KEY,  -- Nombre como clave natural
    -- ... otros atributos
);
```

## Reglas de Transformación Avanzada

### 1. Claves Foráneas y Restricciones de Integridad

**Regla**: Definir claves foráneas para mantener la integridad referencial.

```sql
-- Para asociaciones
ALTER TABLE Account ADD CONSTRAINT fk_account_customer
    FOREIGN KEY (customer_ID) REFERENCES Customer(customer_ID);

-- Para generalizaciones
ALTER TABLE Checking_Account ADD CONSTRAINT fk_chkacct_account
    FOREIGN KEY (chk_acct_ID) REFERENCES Account(account_ID) ON DELETE CASCADE;
```

### 2. Restricciones de Verificación

**Regla**: Implementar enumeraciones y reglas de negocio mediante CHECK constraints.

```sql
-- Para tipos enumerados
ALTER TABLE Account ADD CONSTRAINT ck_account_type
    CHECK (account_type IN ('Checking_Account', 'Savings_Account'));

-- Para reglas de negocio
ALTER TABLE Checking_Account ADD CONSTRAINT ck_protect_overdraft
    CHECK (protect_odrft IN ('Y', 'N'));
```

### 3. Índices para Optimización

**Regla**: Crear índices para todas las claves foráneas no cubiertas por claves primarias.

```sql
-- Índice para clave foránea
CREATE INDEX idx_account_customer ON Account(customer_ID);

-- Índice compuesto si es necesario
CREATE INDEX idx_acct_cardauth_card ON Acct_CardAuth(card_auth_ID);
```

### 4. Vistas para Simplificar Acceso

**Regla**: Crear vistas para consolidar datos de herencia.

```sql
-- Vista para combinar datos de herencia
CREATE VIEW view_checking_account AS
SELECT ca.chk_acct_ID, a.balance, a.credit_limit, ca.protect_odrft
FROM Account a, Checking_Account ca
WHERE a.account_ID = ca.chk_acct_ID;
```

## Secuencia de Transformación

1. **Análisis del Modelo Lógico**: Identificar todas las clases, asociaciones y generalizaciones
2. **Mapeo de Clases**: Crear tablas base con atributos y restricciones básicas
3. **Mapeo de Asociaciones**: Implementar relaciones muchos-a-muchos, uno-a-muchos y uno-a-uno
4. **Mapeo de Generalizaciones**: Crear jerarquías de tablas con claves foráneas apropiadas
5. **Optimización Avanzada**: Añadir índices, vistas y restricciones adicionales
6. **Validación**: Verificar que el modelo físico preserve la semántica del modelo lógico

## Consideraciones de Diseño

### Normalización vs Desnormalización

- **Normalización**: Reduce redundancia de datos (recomendado por defecto)
- **Desnormalización**: Puede mejorar rendimiento para consultas específicas, pero aumenta complejidad de mantenimiento

### Elección de Identidad

- **Object Identity**: Recomendado para la mayoría de aplicaciones OO
- **Value Identity**: Útil cuando los atributos naturales son estables y significativos

### Restricciones de Integridad

- **ON DELETE CASCADE**: Para relaciones de composición
- **ON DELETE NO ACTION**: Para prevenir eliminación accidental de datos relacionados

## Herramientas de Soporte

La mayoría de las herramientas CASE modernas incluyen generadores de código que automatizan estas transformaciones:

- Rational Rose
- Enterprise Architect
- PowerDesigner
- Herramientas ORM (Hibernate, Entity Framework)

## Validación del Mapeo

Después de la transformación, validar que:

1. Todas las clases están representadas
2. Las multiplicidades de asociaciones se preservan
3. Las restricciones de integridad están implementadas
4. El rendimiento de consultas críticas es aceptable
5. La semántica del modelo lógico se mantiene

## Conclusión

La transformación de modelos lógicos a físicos usando OMT proporciona un puente sistemático entre el análisis orientado a objetos y la implementación en bases de datos relacionales. Siguiendo estas reglas, se asegura que el modelo físico sea eficiente, mantenible y fiel al modelo lógico original.

Esta metodología no solo facilita la implementación, sino que también establece las bases para el mantenimiento y evolución del sistema de base de datos.
