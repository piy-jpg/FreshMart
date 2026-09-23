const path = require('path');
const fs = require('fs');

class MediaStorage {
  constructor(uploadDir = path.join(process.cwd(), 'data', 'uploads')) {
    this.uploadDir = uploadDir;
    if (!fs.existsSync(this.uploadDir)) {
      try { fs.mkdirSync(this.uploadDir, { recursive: true }); } catch (e) {}
    }
  }

  saveFile(fileName, buffer) {
    const filePath = path.join(this.uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${fileName}`;
  }

  exists(fileName) {
    return fs.existsSync(path.join(this.uploadDir, fileName));
  }
}

module.exports = new MediaStorage();
