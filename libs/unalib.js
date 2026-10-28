// modulo de ejemplo.

module.exports = {


    // logica que valida si un telefono esta correcto...
    is_valid_phone: function (phone) {
      // inicializacion lazy
      var isValid = false;
      // expresion regular copiada de StackOverflow
      var re = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/i;
  
      // validacion Regex
      try {
        isValid = re.test(phone);
      } catch (e) {
        console.log(e);
      } finally {
          return isValid;
      }
      // fin del try-catch block
    },
  
    is_valid_url_image: function (url) {

      if (typeof url !== 'string') {
        return false;
      }

      // solo imagenes http(s), sin comillas, espacios ni caracteres de tag
      // para que no se pueda cerrar el atributo src de la etiqueta <img>
      var re = /^https?:\/\/[^\s"'<>\u0000-\u001F\u007F]+\.(?:jpg|jpeg|gif|png|bmp)(?:[?#][^\s"'<>\u0000-\u001F\u007F]*)?$/i;

      try {
        return re.test(url.trim());
      } catch (e) {
        console.log(e);
        return false;
      }
    },

    is_valid_url_video: function (url) {

      if (typeof url !== 'string') {
        return false;
      }

      // solo archivos de video http(s) con extension conocida
      var re = /^https?:\/\/[^\s"'<>\u0000-\u001F\u007F]+\.(?:mp4|webm|ogg)(?:[?#][^\s"'<>\u0000-\u001F\u007F]*)?$/i;

      try {
        return re.test(url.trim());
      } catch (e) {
        console.log(e);
        return false;
      }
    },
  
    is_valid_yt_video: function (url) {

      if (typeof url !== 'string') {
        return false;
      }

      // el id de youtube se limita a 11 caracteres [A-Za-z0-9_-]
      // para que no se pueda inyectar html dentro del iframe
      var re = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})$/i;

      try {
        return re.test(url.trim());
      } catch (e) {
        console.log(e);
        return false;
      }
    },
  
    getYTVideoId: function(url){

      if (typeof url !== 'string') {
        return null;
      }

      var match = url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([\w-]{11})/);

      // sin coincidencia valida no devolvemos nada (antes explotaba con null[1])
      return match ? match[1] : null;
    },
  
    getEmbeddedCode: function (url){
      var id = this.getYTVideoId(url);

      // si el id no es valido no generamos iframe, solo texto escapado
      if (!id || !this.is_valid_yt_video(url)) {
        return this.escapeHtml(url);
      }

      var code = '<iframe width="560" height="315" src="https://www.youtube.com/embed/'+id+ '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
      return code;
    },
  
    getImageTag: function(url){

      // solo permitimos esquemas http/https
      if (!this.is_safe_url(url)) {
        return this.escapeHtml(url);
      }

      // escapamos el valor del atributo para que una comilla no rompa el tag
      var tag = '<img src="'+ this.escapeHtml(url.trim()) +'" style="max-height: 400px;max-width: 400px;">';
      return tag;
    },

    getVideoTag: function(url){

      // solo permitimos esquemas http/https
      if (!this.is_safe_url(url)) {
        return this.escapeHtml(url);
      }

      // el reproductor usa la url validada como unica fuente
      var tag = '<video controls style="max-height: 400px;max-width: 400px;" src="'+ this.escapeHtml(url.trim()) +'"></video>';
      return tag;
    },

    // escapa los caracteres especiales de HTML/atributos
    escapeHtml: function (text) {

      if (text === null || text === undefined) {
        return '';
      }

      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/`/g, '&#96;');
    },

    // valida que la url sea http(s) y no contenga comillas, espacios ni tags
    is_safe_url: function (url) {
      if (typeof url !== 'string') {
        return false;
      }
      return /^https?:\/\/[^\s"'<>\u0000-\u001F\u007F]+$/i.test(url.trim());
    },

    // elimina caracteres de control no imprimibles
    stripControlChars: function (text) {
      if (typeof text !== 'string') {
        return '';
      }
      return text.replace(/[\u0000-\u001F\u007F]/g, '');
    },

    // el color se usa dentro de un atributo style, por eso solo aceptamos hex
    sanitizeColor: function (color) {
      var re = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
      if (typeof color === 'string' && re.test(color.trim())) {
        return color.trim();
      }
      return '#000000';
    },
  
    validateMessage: function(msg){
      // Handle invalid input
      if (!msg || typeof msg !== 'string') {
        return JSON.stringify({ nombre: '', mensaje: '', color: '#000000', tipo: 'texto' });
      }

      // los caracteres de control se descartan antes de interpretar el mensaje
      var limpio = this.stripControlChars(msg);
      var obj;

      try {
        obj = JSON.parse(limpio);

      } catch (e) {
        // si el mensaje no es JSON devolvemos el texto escapado, nunca crudo
        console.log('Error processing message:', e);
        return JSON.stringify({
          nombre: '',
          mensaje: this.escapeHtml(limpio),
          color: '#000000',
          tipo: 'texto'
        });
      }

      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        // primitivos JSON (null, numeros, booleanos) no son mensajes validos
        return JSON.stringify({
          nombre: '',
          mensaje: typeof obj === 'string' ? this.escapeHtml(obj) : '',
          color: '#000000',
          tipo: 'texto'
        });
      }

      // solo aceptamos strings; cualquier otro tipo se normaliza a vacio
      var texto = (typeof obj.mensaje === 'string') ? this.stripControlChars(obj.mensaje) : '';
      var nombre = (typeof obj.nombre === 'string') ? this.stripControlChars(obj.nombre) : '';

      // nombre escapado (nunca se inyecta html)
      obj.nombre = this.escapeHtml(nombre) || 'Anomimo';

      // color validado contra la lista blanca de hexadecimales
      obj.color = this.sanitizeColor(obj.color);

      if(this.is_valid_url_image(texto)){
        console.log("Es una imagen!")
        obj.mensaje = this.getImageTag(texto);
        obj.tipo = 'imagen';
      }
      else if(this.is_valid_yt_video(texto)){
        console.log("Es un video!")
        obj.mensaje = this.getEmbeddedCode(texto);
        obj.tipo = 'video';
      }
      else if(this.is_valid_url_video(texto)){
        console.log("Es un video!")
        obj.mensaje = this.getVideoTag(texto);
        obj.tipo = 'video';
      }
      else{
        // el texto normal tambien viaja escapado
        console.log("Es un texto!")
        obj.mensaje = this.escapeHtml(texto);
        obj.tipo = 'texto';
      }

      return JSON.stringify(obj);
    }
  
  
  
    
  
  // fin del modulo
  };
  
