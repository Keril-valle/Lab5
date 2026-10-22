var val = require('../libs/unalib');
var assert = require('assert');

// analiza la respuesta que viaja por el socket
function parse(msg) {
  return JSON.parse(val.validateMessage(msg));
}

function chat(nombre, mensaje, color) {
  return JSON.stringify({ nombre: nombre, mensaje: mensaje, color: color });
}


describe('unalib', function(){


  describe('funcion is_valid_phone', function(){

    it('deberia devolver true para 8297-8547', function(){

      assert.equal(val.is_valid_phone('8297-8547'), true);

    });

    it('deberia devolver false para 8297p-8547', function(){

      assert.equal(val.is_valid_phone('8297p-8547'), false);

    });

  });


  describe('funcion is_valid_url_image', function(){

    it('deberia devolver true para http://image.com/image.jpg', function(){

      assert.equal(val.is_valid_url_image('http://image.com/image.jpg'), true);

    });

    it('deberia devolver true para http://image.com/image.gif', function(){

      assert.equal(val.is_valid_url_image('http://image.com/image.gif'), true);

    });

    it('deberia devolver false para una url con comillas (ruptura de atributo)', function(){

      assert.equal(val.is_valid_url_image('http://a.com/a.jpg" onerror="alert(1)'), false);

    });

  });

  describe('funcion is_valid_yt_video', function(){

    it('deberia devolver true para https://www.youtube.com/watch?v=qYwlqx-JLok', function(){

      assert.equal(val.is_valid_yt_video('https://www.youtube.com/watch?v=qYwlqx-JLok'), true);

    });

    it('deberia devolver false si el id trae caracteres de html', function(){

      assert.equal(val.is_valid_yt_video('https://youtu.be/qYwlqx-JLok"><script>alert(1)</script>'), false);

    });

  });


  describe('proteccion contra inyeccion de scripts', function(){

    it('escapeHtml convierte los caracteres especiales de HTML', function(){

      assert.equal(val.escapeHtml('<script>alert(1)</script>'),
        '&lt;script&gt;alert(1)&lt;/script&gt;');

      assert.equal(val.escapeHtml('hola "mundo" & <b>'), 'hola &quot;mundo&quot; &amp; &lt;b&gt;');

    });

    it('is_safe_url solo acepta http(s) y rechaza javascript: y comillas', function(){

      assert.equal(val.is_safe_url('https://image.com/a.png'), true);
      assert.equal(val.is_safe_url('javascript:alert(1)'), false);
      assert.equal(val.is_safe_url('http://a.com/a.jpg" onerror="alert(1)'), false);

    });

    it('sanitizeColor solo acepta colores en hexadecimal', function(){

      assert.equal(val.sanitizeColor('#ff00aa'), '#ff00aa');
      assert.equal(val.sanitizeColor('#FFF'), '#FFF');
      assert.equal(val.sanitizeColor("';</style><script>alert(1)</script>"), '#000000');
      assert.equal(val.sanitizeColor('red;background:url(javascript:alert(1))'), '#000000');

    });

    it('el mensaje de texto no puede inyectar <script>', function(){

      var r = parse(chat('ana', '<script>alert(1)</script>', '#ff0000'));

      assert.equal(r.tipo, 'texto');
      assert.equal(r.mensaje, '&lt;script&gt;alert(1)&lt;/script&gt;');
      assert.equal(r.mensaje.indexOf('<script'), -1);

    });

    it('el mensaje de texto no puede inyectar una etiqueta con eventos', function(){

      var r = parse(chat('ana', '<img src=x onerror=alert(1)>', '#ff0000'));

      assert.equal(r.tipo, 'texto');
      // no quedan etiquetas ni angulos crudos: viaja como texto plano
      assert.equal(r.mensaje.indexOf('<img'), -1);
      assert.equal(r.mensaje.indexOf('<'), -1);
      assert.equal(r.mensaje.indexOf('>'), -1);

    });

    it('un nombre con HTML se escapa antes de retransmitirlo', function(){

      var r = parse(chat('<script>alert(1)</script>', 'hola', '#ff0000'));

      assert.equal(r.nombre, '&lt;script&gt;alert(1)&lt;/script&gt;');
      assert.equal(r.nombre.indexOf('<script'), -1);

    });

    it('el color se sanea contra la lista blanca hexadecimal', function(){

      var r = parse(chat('ana', 'hola', "red;}</style><script>alert(1)</script>"));

      assert.equal(r.color, '#000000');

    });

    it('una imagen no puede romper el atributo src con comillas', function(){

      var r = parse(chat('ana', 'http://a.com/a.jpg" onerror="alert(1)', '#ff0000'));

      // no se convierte en <img>, viaja como texto escapado
      assert.equal(r.tipo, 'texto');
      assert.equal(r.mensaje.indexOf('<img'), -1);
      // la comilla que romperia el atributo src viaja escapada como &quot;
      assert.equal(r.mensaje.indexOf('"'), -1);
      assert.equal(r.mensaje.indexOf('&quot;') > 0, true);

    });

    it('una imagen no puede usar el esquema javascript:', function(){

      var r = parse(chat('ana', 'javascript:alert(1)//http://a.com/a.jpg', '#ff0000'));

      assert.equal(r.tipo, 'texto');
      assert.equal(r.mensaje.indexOf('<img'), -1);

    });

    it('una imagen valida se genera con el src escapado y sin eventos', function(){

      var r = parse(chat('ana', 'http://image.com/image.jpg', '#ff0000'));

      assert.equal(r.tipo, 'imagen');
      assert.equal(r.mensaje.indexOf('<img src="http://image.com/image.jpg"'), 0);
      assert.equal(r.mensaje.indexOf('onerror'), -1);

    });

    it('una imagen con %22 en la url no rompe el atributo src', function(){

      var r = parse(chat('ana', 'http://a.com/a.jpg%22%20onerror=%22alert(1)', '#ff0000'));

      // el navegador decodifica %22, pero dentro del HTML nunca se vuelve comilla cruda
      assert.equal(r.mensaje.indexOf('" onerror'), -1);

    });

    it('un video de youtube con html no genera iframe', function(){

      var r = parse(chat('ana', 'https://youtu.be/qYwlqx-JLok"><script>alert(1)</script>', '#ff0000'));

      assert.equal(r.tipo, 'texto');
      assert.equal(r.mensaje.indexOf('<iframe'), -1);
      assert.equal(r.mensaje.indexOf('<script'), -1);

    });

    it('un video valido genera un iframe con el id saneado', function(){

      var r = parse(chat('ana', 'https://www.youtube.com/watch?v=qYwlqx-JLok', '#ff0000'));

      assert.equal(r.tipo, 'video');
      assert.equal(r.mensaje.indexOf('<iframe'), 0);
      assert.equal(r.mensaje.indexOf('youtube.com/embed/qYwlqx-JLok') > 0, true);

    });

    it('getYTVideoId devuelve solo el id y null si hay inyeccion', function(){

      assert.equal(val.getYTVideoId('https://www.youtube.com/watch?v=qYwlqx-JLok'), 'qYwlqx-JLok');
      assert.equal(val.getYTVideoId('https://youtu.be/"><script>alert(1)</script>'), null);

    });

    it('un mensaje que no es JSON viaja escapado', function(){

      var r = parse('<script>alert(1)</script>');

      assert.equal(r.tipo, 'texto');
      assert.equal(r.mensaje, '&lt;script&gt;alert(1)&lt;/script&gt;');

    });

    it('entradas invalidas no generan mensajes crudos', function(){

      assert.equal(parse('').mensaje, '');
      assert.equal(parse(null).mensaje, '');
      assert.equal(parse(123).mensaje, '');

    });

  });

});
