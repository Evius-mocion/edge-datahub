
FROM node:22 

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Copiar solo los archivos necesarios para instalar dependencias
COPY package*.json ./
COPY .env ./

# Instalar dependencias (usando npm ci para builds reproducibles)
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Construir la aplicación
RUN npm run build


# Exponer el puerto
EXPOSE 3000

# Comando de inicio (usando script Nest oficial)
CMD ["npm", "run", "start:dev"]
