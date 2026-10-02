-- Script DDL para Base de Datos AquaChile MVP
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    rol VARCHAR(50) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidatos (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    rut VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(30),
    cv_url TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS solicitudes_evaluacion (
    id SERIAL PRIMARY KEY,
    candidato_id INT REFERENCES candidatos(id) ON DELETE CASCADE,
    solicitante_id INT REFERENCES usuarios(id),
    familia_cargo VARCHAR(100) NOT NULL,
    nombre_cargo VARCHAR(100) NOT NULL,
    estado VARCHAR(50) DEFAULT 'Pendiente',
    fecha_solicitud DATE DEFAULT CURRENT_DATE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evaluaciones_psicologicas (
    id SERIAL PRIMARY KEY,
    solicitud_id INT REFERENCES solicitudes_evaluacion(id) ON DELETE CASCADE,
    evaluador_id INT REFERENCES usuarios(id),
    fecha_evaluacion DATE NOT NULL,
    estado_resultado VARCHAR(50) NOT NULL,
    observaciones TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO usuarios (nombre, email, rol) VALUES 
('Analista Reclutamiento', 'reclutamiento@aquachile.cl', 'Analista'),
('Psicólogo Evaluador', 'evaluador@aquachile.cl', 'Evaluador')
ON CONFLICT (email) DO NOTHING;