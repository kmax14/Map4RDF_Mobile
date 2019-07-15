var map = L.map('map').setView([40.436890, -3.647326], 5)

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map)

var markersMap = new Map();
var flagsMap = new Map();



function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function descargarArchivo(contenidoEnBlob, nombreArchivo) {
  var reader = new FileReader();
  reader.onload = function (event) {
      var save = document.createElement('a');
      save.href = event.target.result;
      save.target = '_blank';
      save.download = nombreArchivo || 'archivo.dat';
      var clicEvent = new MouseEvent('click', {
          'view': window,
              'bubbles': true,
              'cancelable': true
      });
      save.dispatchEvent(clicEvent);
      (window.URL || window.webkitURL).revokeObjectURL(save.href);
  };
  reader.readAsDataURL(contenidoEnBlob);
};

document.getElementById('btn-descargar').addEventListener('click', function () {
  if (resultados.length > 0) {
    descargarArchivo(generarArchivo(resultados), 'resultados.csv');
  }
}, false);

function generarArchivo(datos) {

  var texto = [];
  for(var f = 0; f < datos.length; f++) {
    texto.push(datos[f] + '\n');
  }

  return new Blob(texto, {
      type: 'text/plain'
  });

}

var resultados = new Array();
resultados.push('Resultados');

function ejecutarQuery(id) {

    checkbox = document.getElementById(id);
  
    let uri = 'PREFIX dc: <http://purl.org/dc/terms/> PREFIX geosparql: <http://www.opengis.net/ont/geosparql#> PREFIX btn100:<https://datos.ign.es/def/btn100#> select distinct ?recurso ?coordenadas ?nombre where { ?recurso a btn100:' + id + ' . ?recurso dc:title ?nombre . ?recurso geosparql:hasGeometry ?geoNucleo . ?geoNucleo geosparql:asWKT ?coordenadas. }'
    
    let geo_uri_encoded = "";
    geo_uri_encoded = encodeURIComponent(uri).replace(/'/g,"%27").replace(/"/g,"%22");	
 
    var geo_uri = "https://datos.ign.es/sparql?default-graph-uri=&query=" + geo_uri_encoded + "&format=json&timeout=0"
    
    $.ajax({
      method: 'GET',
      dataType: 'jsonp',
      url: geo_uri,
      success: function (respuesta) {

            datos = respuesta.results.bindings;

            var colorR = Math.floor((Math.random() * 256));
            var colorG = Math.floor((Math.random() * 256));
            var colorB = Math.floor((Math.random() * 256));

            var colorHex = "#" + componentToHex(colorR) + componentToHex(colorG) + componentToHex(colorB);

            if (checkbox.checked) {
              document.getElementById(id).style.boxShadow = "0 0 0 3px " + colorHex;
            }
            else {
              document.getElementById(id).style.boxShadow = 'none';
            }

            var limites= map.getBounds();

            var coordxLimitSup = limites._northEast.lat;
            var coordyLimitSup = limites._northEast.lng;
            var coordxLimitInf = limites._southWest.lat;
            var coordyLimitInf = limites._southWest.lng;

            console.log(coordxLimitSup);
            console.log(coordyLimitSup);
            console.log(coordxLimitInf);
            console.log(coordyLimitInf);


            var markerObject = new Array();
            var poligonObject = new Array();
            var lineObject = new Array();
            var groupMarkers = L.layerGroup([]);
            var groupPolygons = L.layerGroup([]);
            var groupLines = L.layerGroup([]);
        
            var x = 0;
            for(var i = 0; i < datos.length; i++) {

              let treeMarker =  L.ExtraMarkers.icon({
                icon: 'fa-circle',
                markerColor: 'white',
                iconColor: colorHex,
                shape: 'circle',
                prefix: 'fa'
              })
          
              var tipoDatos = datos[i].coordenadas.value.split("(")[0];
              var base = datos[i].coordenadas.value.split("(");
              
              var nombre = datos[i].nombre.value;
              var recurso = datos[i].recurso.value;

              if (tipoDatos == "POLYGON" && checkbox.checked) {

                var longPoligon = base[2].split(",").length;
                var puntoPol = base[2].split(",");
                var coordPol = new Array();
                for(var j = 0; j < longPoligon-1; j++) {
                  var coordyPol = puntoPol[j].split(" ")[0];
                  var coordxPol = puntoPol[j].split(" ")[1];
                  if (j == longPoligon-1) {
                    coordxPol = coordxPol.split(")")[0];
                  }
                  var arrayPol = [coordxPol,coordyPol];
                  if ((coordxLimitInf <= coordxPol) && (coordxPol <= coordxLimitSup) && (coordyLimitInf <= coordyPol) && (coordyPol <= coordyLimitSup)) {
                    coordPol.push(arrayPol);
                    resultados.push(recurso);
                  }
                }
                poligonObject[i] = coordPol;
                var popup = L.popup().setContent("<b>Tipo</b>: "+ id + "<br>" + "<b>Nombre</b>: "+ nombre + "<br><b>Recurso</b>:<br><a href="+recurso+">" + recurso +"</a>");
                var polygon = L.polygon(coordPol, {color: colorHex}).bindPopup(popup);
                x = x + 1;
                groupPolygons.addLayer(polygon)
              }
              else if (tipoDatos == "LINESTRING" && checkbox.checked) {

                var longLine = base[1].split(",").length;
                var puntoLine = base[1].split(",");
                var coordLine = new Array();
                for(var j = 0; j < longLine-1; j++) {
                  var coordyLine = puntoLine[j].split(" ")[0];
                  var coordxLine = puntoLine[j].split(" ")[1];
                  if (j == longLine-1) {
                    coordxLine = coordxLine.split(")")[0];
                  }
                  var arrayLine = [coordxLine,coordyLine];
                  if ((coordxLimitInf <= coordxLine) && (coordxLine <= coordxLimitSup) && (coordyLimitInf <= coordyLine) && (coordyLine <= coordyLimitSup)) {
                    coordLine.push(arrayLine);
                    resultados.push(recurso);
                  }
                }
                lineObject[i] = coordLine;
                var popup = L.popup().setContent("<b>Tipo</b>: "+ id + "<br>" + "<b>Nombre</b>: "+ nombre + "<br><b>Recurso</b>:<br><a href="+recurso+">" + recurso +"</a>");
                var line = L.polyline(coordLine, {color: colorHex}).bindPopup(popup);
                x = x + 1;
                groupLines.addLayer(line)

              }
              else if (tipoDatos == "POINT" && checkbox.checked) {

                var basePoint = base[1].split(" ");
                var long2 = basePoint[1].length;
                var coordy = basePoint[0];
                var coordx = basePoint[1].substring(0,long2-1);

                var popup = L.popup().setContent("<b>Tipo</b>: "+ id + "<br>" + "<b>Nombre</b>: "+ nombre + "<br><b>Recurso</b>:<br><a href="+recurso+" target='blank'>" + recurso +"</a>");
                var marker = L.marker([coordx, coordy]).bindPopup(popup).setIcon(treeMarker);
                if ((coordxLimitInf <= coordx) && (coordx <= coordxLimitSup) && (coordyLimitInf <= coordy) && (coordy <= coordyLimitSup)) {
                  markerObject[i] = marker;
                  x = x + 1;
                  groupMarkers.addLayer(marker);
                  resultados.push(recurso);
                }
              }
            }

            if (tipoDatos == "POINT") {
              console.log(x);
              if(x > 150 && checkbox.checked) {
                flagsMap.set(id,1);
                alert("Alcanzado número máximo de resultados (150). Para ver más recursos, haga zoom en el mapa y recargue la página.")
                var resultados150 = L.layerGroup([]);
                var arrayLayers = groupMarkers.getLayers();
                console.log(arrayLayers[0]);
                for(var s = 0; s < 150; s++) {
                  resultados150.addLayer(arrayLayers[s]);
                }
                map.addLayer(resultados150);
                markersMap.set(id, resultados150);
              }
              else if(x <= 150 && checkbox.checked) {
                map.addLayer(groupMarkers);
                markersMap.set(id, groupMarkers);
              } 
              else {
                var grupoBorrar = markersMap.get(id);
                map.removeLayer(grupoBorrar);
              }
            }

            if (tipoDatos == "POLYGON") {
              console.log(x);
              if(x > 150 && checkbox.checked) {
                flagsMap.set(id,1);
                alert("Alcanzado número máximo de resultados (150). Para ver más recursos, haga zoom en el mapa y recargue la página.")
                var resultados150 = L.layerGroup([]);
                for(var s = 0; s < 150; s++) {
                  resultados150.addLayer(groupPolygons.getLayer(s));
                }
                map.addLayer(resultados150);
              }
              else if(x <= 150 && checkbox.checked) {
                map.addLayer(groupPolygons);
                markersMap.set(id, groupPolygons);
              } 
              else if(flagsMap.get(id) != 1) {
                var grupoBorrar = markersMap.get(id);
                map.removeLayer(grupoBorrar);
              }
            }

            if (tipoDatos == "LINESTRING") {
              console.log(x);
              if(x > 150 && checkbox.checked) {
                flagsMap.set(id,1);
                alert("Alcanzado número máximo de resultados (150). Para ver más recursos, haga zoom en el mapa y recargue la página.")
                var resultados150 = L.layerGroup([]);
                for(var s = 0; s < 150; s++) {
                  resultados150.addLayer(groupLines.getLayer(s));
                }
                map.addLayer(resultados150);
              }
              else if(x <= 150 && checkbox.checked) {
                map.addLayer(groupLines);
                markersMap.set(id, groupLines);
              } 
              else if(flagsMap.get(id) != 1) {
                var grupoBorrar = markersMap.get(id);
                map.removeLayer(grupoBorrar);
              }
            }
            
      },
      error: function() { alert('Algo no va bien') },
    }); 
}