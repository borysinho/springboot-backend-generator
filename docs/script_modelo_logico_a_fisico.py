#!/usr/bin/env python3
"""
Generador automático de Backend JPA desde DDL
Genera: Entity, Repository, Service, Controller, DTO
"""

import re
import os
from pathlib import Path

# ============= CONFIGURACIÓN =============
DDL_EXAMPLE = """
CREATE TABLE producto (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0
);
"""

BASE_PACKAGE = "com.example.demo"
PROJECT_PATH = "./generated"

# ============= MAPEO DE TIPOS =============
TYPE_MAPPING = {
    'BIGINT': 'Long',
    'INT': 'Integer',
    'INTEGER': 'Integer',
    'VARCHAR': 'String',
    'TEXT': 'String',
    'DECIMAL': 'BigDecimal',
    'NUMERIC': 'BigDecimal',
    'BOOLEAN': 'Boolean',
    'DATE': 'LocalDate',
    'TIMESTAMP': 'LocalDateTime',
    'DATETIME': 'LocalDateTime',
    'DOUBLE': 'Double',
    'FLOAT': 'Float'
}

# ============= PARSER DDL =============
def parse_ddl(ddl):
    """Extrae información de la tabla desde el DDL"""
    # Extraer nombre de tabla
    table_match = re.search(r'CREATE TABLE (\w+)', ddl, re.IGNORECASE)
    if not table_match:
        raise ValueError("No se encontró CREATE TABLE en el DDL")
    
    table_name = table_match.group(1).lower()
    
    # Extraer campos
    fields = []
    field_pattern = r'(\w+)\s+([\w\(\),\s]+?)(?:PRIMARY KEY|NOT NULL|DEFAULT|,|\))'
    
    for match in re.finditer(field_pattern, ddl, re.IGNORECASE):
        field_name = match.group(1).lower()
        field_type_raw = match.group(2).strip().upper()
        
        # Obtener tipo base (sin parámetros)
        base_type = re.match(r'(\w+)', field_type_raw).group(1)
        java_type = TYPE_MAPPING.get(base_type, 'String')
        
        # Verificar si es primary key
        is_primary = 'PRIMARY KEY' in ddl[match.end():match.end()+50].upper()
        
        fields.append({
            'name': field_name,
            'type': java_type,
            'is_primary': is_primary
        })
    
    return {
        'table_name': table_name,
        'class_name': snake_to_camel(table_name),
        'fields': fields
    }

# ============= UTILIDADES =============
def snake_to_camel(snake_str):
    """Convierte snake_case a CamelCase"""
    components = snake_str.split('_')
    return ''.join(x.title() for x in components)

def snake_to_camel_lower(snake_str):
    """Convierte snake_case a camelCase"""
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

def create_directory(path):
    """Crea directorio si no existe"""
    Path(path).mkdir(parents=True, exist_ok=True)

# ============= GENERADORES =============
def generate_entity(table_info, package):
    """Genera la clase Entity JPA"""
    class_name = table_info['class_name']
    table_name = table_info['table_name']
    
    imports = ['javax.persistence.*', 'lombok.Data']
    if any(f['type'] == 'BigDecimal' for f in table_info['fields']):
        imports.append('java.math.BigDecimal')
    if any(f['type'] in ['LocalDate', 'LocalDateTime'] for f in table_info['fields']):
        imports.append('java.time.*')
    
    fields_code = []
    for field in table_info['fields']:
        if field['is_primary']:
            fields_code.append(f"""    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private {field['type']} {snake_to_camel_lower(field['name'])};""")
        else:
            fields_code.append(f"    private {field['type']} {snake_to_camel_lower(field['name'])};")
    
    return f"""package {package}.entity;

{chr(10).join(f'import {imp};' for imp in imports)}

@Entity
@Table(name = "{table_name}")
@Data
public class {class_name} {{

{chr(10).join(fields_code)}
}}
"""

def generate_repository(table_info, package):
    """Genera el Repository"""
    class_name = table_info['class_name']
    id_field = next((f for f in table_info['fields'] if f['is_primary']), table_info['fields'][0])
    
    return f"""package {package}.repository;

import {package}.entity.{class_name};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface {class_name}Repository extends JpaRepository<{class_name}, {id_field['type']}> {{
}}
"""

def generate_dto(table_info, package):
    """Genera el DTO"""
    class_name = table_info['class_name']
    
    imports = ['lombok.Data']
    if any(f['type'] == 'BigDecimal' for f in table_info['fields']):
        imports.append('import java.math.BigDecimal;')
    if any(f['type'] in ['LocalDate', 'LocalDateTime'] for f in table_info['fields']):
        imports.append('import java.time.*;')
    
    fields_code = [f"    private {f['type']} {snake_to_camel_lower(f['name'])};" 
                   for f in table_info['fields']]
    
    return f"""package {package}.dto;

{chr(10).join(imports)}

@Data
public class {class_name}DTO {{

{chr(10).join(fields_code)}
}}
"""

def generate_service(table_info, package):
    """Genera el Service"""
    class_name = table_info['class_name']
    var_name = snake_to_camel_lower(class_name)
    id_field = next((f for f in table_info['fields'] if f['is_primary']), table_info['fields'][0])
    
    return f"""package {package}.service;

import {package}.entity.{class_name};
import {package}.repository.{class_name}Repository;
import {package}.dto.{class_name}DTO;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class {class_name}Service {{

    private final {class_name}Repository repository;

    public List<{class_name}DTO> findAll() {{
        return repository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }}

    public {class_name}DTO findById({id_field['type']} id) {{
        return repository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new RuntimeException("{class_name} no encontrado"));
    }}

    public {class_name}DTO create({class_name}DTO dto) {{
        {class_name} entity = toEntity(dto);
        {class_name} saved = repository.save(entity);
        return toDTO(saved);
    }}

    public {class_name}DTO update({id_field['type']} id, {class_name}DTO dto) {{
        {class_name} entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("{class_name} no encontrado"));
        BeanUtils.copyProperties(dto, entity, "{snake_to_camel_lower(id_field['name'])}");
        return toDTO(repository.save(entity));
    }}

    public void delete({id_field['type']} id) {{
        repository.deleteById(id);
    }}

    private {class_name}DTO toDTO({class_name} entity) {{
        {class_name}DTO dto = new {class_name}DTO();
        BeanUtils.copyProperties(entity, dto);
        return dto;
    }}

    private {class_name} toEntity({class_name}DTO dto) {{
        {class_name} entity = new {class_name}();
        BeanUtils.copyProperties(dto, entity);
        return entity;
    }}
}}
"""

def generate_controller(table_info, package):
    """Genera el REST Controller"""
    class_name = table_info['class_name']
    var_name = snake_to_camel_lower(class_name)
    endpoint = '/' + table_name_to_plural(table_info['table_name'])
    id_field = next((f for f in table_info['fields'] if f['is_primary']), table_info['fields'][0])
    
    return f"""package {package}.controller;

import {package}.dto.{class_name}DTO;
import {package}.service.{class_name}Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("{endpoint}")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class {class_name}Controller {{

    private final {class_name}Service service;

    @GetMapping
    public ResponseEntity<List<{class_name}DTO>> getAll() {{
        return ResponseEntity.ok(service.findAll());
    }}

    @GetMapping("/{{{id_field['name']}}}")
    public ResponseEntity<{class_name}DTO> getById(@PathVariable {id_field['type']} {snake_to_camel_lower(id_field['name'])}) {{
        return ResponseEntity.ok(service.findById({snake_to_camel_lower(id_field['name'])}));
    }}

    @PostMapping
    public ResponseEntity<{class_name}DTO> create(@RequestBody {class_name}DTO dto) {{
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto));
    }}

    @PutMapping("/{{{id_field['name']}}}")
    public ResponseEntity<{class_name}DTO> update(
            @PathVariable {id_field['type']} {snake_to_camel_lower(id_field['name'])},
            @RequestBody {class_name}DTO dto) {{
        return ResponseEntity.ok(service.update({snake_to_camel_lower(id_field['name'])}, dto));
    }}

    @DeleteMapping("/{{{id_field['name']}}}")
    public ResponseEntity<Void> delete(@PathVariable {id_field['type']} {snake_to_camel_lower(id_field['name'])}) {{
        service.delete({snake_to_camel_lower(id_field['name'])});
        return ResponseEntity.noContent().build();
    }}
}}
"""

def table_name_to_plural(table_name):
    """Convierte nombre de tabla a plural para endpoint"""
    if table_name.endswith('o'):
        return table_name + 's'
    return table_name + 's'

def generate_pom_dependencies():
    """Genera las dependencias necesarias para pom.xml"""
    return """
<!-- Añade estas dependencias a tu pom.xml -->
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
    <!-- Tu driver de base de datos (MySQL, PostgreSQL, etc.) -->
</dependencies>
"""

# ============= MAIN =============
def generate_backend(ddl, base_package, output_path):
    """Genera todo el backend desde un DDL"""
    print("🚀 Iniciando generación de backend...")
    
    # Parse DDL
    table_info = parse_ddl(ddl)
    print(f"✓ Tabla parseada: {table_info['table_name']}")
    
    # Crear estructura de carpetas
    package_path = base_package.replace('.', '/')
    base_path = f"{output_path}/src/main/java/{package_path}"
    
    folders = ['entity', 'repository', 'dto', 'service', 'controller']
    for folder in folders:
        create_directory(f"{base_path}/{folder}")
    
    # Generar archivos
    files = {
        f"{base_path}/entity/{table_info['class_name']}.java": 
            generate_entity(table_info, base_package),
        f"{base_path}/repository/{table_info['class_name']}Repository.java": 
            generate_repository(table_info, base_package),
        f"{base_path}/dto/{table_info['class_name']}DTO.java": 
            generate_dto(table_info, base_package),
        f"{base_path}/service/{table_info['class_name']}Service.java": 
            generate_service(table_info, base_package),
        f"{base_path}/controller/{table_info['class_name']}Controller.java": 
            generate_controller(table_info, base_package),
    }
    
    for filepath, content in files.items():
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Generado: {filepath}")
    
    # Generar README con dependencias
    with open(f"{output_path}/DEPENDENCIES.txt", 'w') as f:
        f.write(generate_pom_dependencies())
    
    print(f"\n✅ Backend generado exitosamente en: {output_path}")
    print(f"📦 Paquete base: {base_package}")
    print(f"🎯 Endpoints generados: /{table_name_to_plural(table_info['table_name'])}")

if __name__ == "__main__":
    # Puedes modificar estas variables
    generate_backend(DDL_EXAMPLE, BASE_PACKAGE, PROJECT_PATH)
    
    print("\n📝 Para usar con tu propio DDL:")
    print("1. Modifica la variable DDL_EXAMPLE con tu DDL")
    print("2. Ajusta BASE_PACKAGE con tu paquete")
    print("3. Ejecuta: python generate_backend.py")