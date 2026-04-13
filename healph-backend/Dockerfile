FROM node:18-alpine

WORKDIR /healph-backend/
COPY . ./
RUN npm install
# Create runtime directories that are gitignored and won't exist in the cloned repo
RUN mkdir -p /healph-backend/log /healph-backend/profpics

EXPOSE 3000
CMD ["npm", "start"]
