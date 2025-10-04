#!/bin/bash

# USO: chmod +x tree_structure.sh 
# USO: ./tree_structure.sh

BASE_DIR="."

# Lista de nombres o patrones de carpetas/archivos a ignorar
IGNORE_PATTERNS=(
    "venv" ".venv" "env" ".env"
    ".git" "__pycache__" ".pytest_cache"
    ".mypy_cache" ".tox" ".eggs"
    ".idea" ".vscode" ".DS_Store"
    ".terraform" ".next" "node_modules"
    ".python_packages"

    # Angular
    "dist" "karma.conf.js" "tsconfig.*" ".angular"
    # Autogen
    "autogen"
    # npm
    "package.json" "package-lock.json" "pnpm-lock.yaml" "yarn.lock"
    # tests
    "tests" "test" "coverage" ".coverage"
)

IGNORE_FILES_PATTERNS=(
    "*.pyc" "*.pyo" "*.log" "*.bak"
    "*.swp" "*.tmp" "*.lock" ".DS_Store"
    "*.spec.ts" "*.test.ts"
)

# Función para construir expresión de exclusión para find
build_ignore_expr() {
    local expr=""
    for pattern in "${IGNORE_PATTERNS[@]}"; do
        expr+=" -name \"$pattern\" -o"
    done
    expr=${expr% -o}
    echo "$expr"
}

# Función para saber si un archivo debe ser ignorado por patrón
should_ignore_file() {
    local filename="$1"
    for pattern in "${IGNORE_FILES_PATTERNS[@]}"; do
        if [[ "$filename" == $pattern ]]; then
            return 0
        fi
    done
    return 1
}

# Función para imprimir árbol de forma recursiva
print_tree() {
    local dir="$1"
    local prefix="$2"

    # Directorios primero
    for folder in $(find "$dir" -maxdepth 1 -mindepth 1 -type d | sort); do
        local base=$(basename "$folder")
        if [[ " ${IGNORE_PATTERNS[@]} " =~ " $base " ]]; then
            continue
        fi
        echo "${prefix}📂 $base"
        print_tree "$folder" "$prefix  "
    done

    # Archivos después
    for file in $(find "$dir" -maxdepth 1 -mindepth 1 -type f | sort); do
        local base=$(basename "$file")
        should_ignore_file "$base" && continue
        if [[ " ${IGNORE_PATTERNS[@]} " =~ " $base " ]]; then
            continue
        fi
        echo "${prefix}📄 $base"
    done
}

print_tree "$BASE_DIR" ""
