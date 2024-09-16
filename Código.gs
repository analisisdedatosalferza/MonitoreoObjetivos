// Función para desplegar la interfaz HTML
function doGet() {
  Logger.log("Cargando la interfaz HTML.");
  return HtmlService.createHtmlOutputFromFile('Index').setTitle('Aprobación de Objetivos');
}

// Cargar usuarios desde la hoja "Usuarios"
function cargarUsuariosDesdeSheet() {
  Logger.log("Iniciando carga de usuarios desde la hoja 'Usuarios'.");
  
  var sheet = SpreadsheetApp.openById('1tGEUndk0_iEQpfI7ZUBUSisjLkytru4t1kenX-ry3Yo').getSheetByName('Usuarios');
  if (!sheet) {
    Logger.log("Error: Hoja 'Usuarios' no encontrada.");
    return { error: "Hoja 'Usuarios' no encontrada." };
  }

  var data = sheet.getDataRange().getValues();
  Logger.log("Datos de la hoja 'Usuarios' cargados: " + JSON.stringify(data));

  var usuarios = [];
  for (var i = 1; i < data.length; i++) {
    var usuario = {
      dni: data[i][1],   // Columna B (DNI)
      nombre: data[i][2], // Columna C (Nombres)
      area: data[i][4],  // Columna E (Área)
      cargo: data[i][3]  // Columna D (Cargo)
    };
    usuarios.push(usuario);
  }

  Logger.log("Usuarios procesados: " + JSON.stringify(usuarios));
  return usuarios;  // Devuelve el array de usuarios
}

function cargarObjetivosDesdeSheet() {
  Logger.log("Iniciando carga de objetivos desde la hoja 'Objetivos'.");
  
  var sheetObjetivos = SpreadsheetApp.openById('1tGEUndk0_iEQpfI7ZUBUSisjLkytru4t1kenX-ry3Yo').getSheetByName('Objetivos');
  if (!sheetObjetivos) {
    Logger.log("Error: Hoja 'Objetivos' no encontrada.");
    return { error: "Hoja 'Objetivos' no encontrada." };
  }

  var dataObjetivos = sheetObjetivos.getDataRange().getValues();
  Logger.log("Datos de la hoja 'Objetivos' cargados: " + JSON.stringify(dataObjetivos));

  if (dataObjetivos.length <= 1) {
    Logger.log("No se encontraron objetivos en la hoja.");
    return [];
  }

  var objetivos = [];
  for (var i = 1; i < dataObjetivos.length; i++) {
    var fila = dataObjetivos[i];
    
    if (fila.length > 0 && fila[0]) {
      var objetivo = {
        fecha: formatearFecha(fila[0]),  // Aplicamos la función formatearFecha aquí
        idObjetivo: fila[1] || "",
        areaUsuario: fila[2] || "",
        idUsuario: fila[3] || "",
        nombreUsuario: fila[4] || "",
        descripcion: fila[5] || "",
        aprobado: fila[6] || 'Pendiente',
        status: fila[7] || 'No Completado',
        evidencia: formatearFecha(fila[8]),  // Aseguramos que la evidencia esté en formato dd/mm/aaaa
        cargoUsuario: fila[9] || "",
        fechaActualizada: formatearFecha(fila[10])  // Aplicamos la función formatearFecha aquí
      };
      Logger.log("Objetivo procesado: " + JSON.stringify(objetivo));
      objetivos.push(objetivo);
    }
  }

  Logger.log("Objetivos procesados: " + JSON.stringify(objetivos));
  return JSON.stringify(objetivos);  // Devuelve los datos de objetivos
}

// Función para convertir la fecha al formato DD/MM/YYYY
function formatearFecha(fecha) {
  if (fecha instanceof Date) {
    // Simplemente obtenemos el día, mes y año sin ajustar la zona horaria manualmente
    let day = String(fecha.getDate()).padStart(2, '0');
    let month = String(fecha.getMonth() + 1).padStart(2, '0');
    let year = fecha.getFullYear();
    
    return `${day}/${month}/${year}`;
  } else {
    // Si no es una fecha válida, devolverla como está
    return fecha;
  }
}

// Función para actualizar los objetivos modificados en Google Sheets
function actualizarObjetivosEnSheet(objetivosModificados) {
  Logger.log("Iniciando actualización de objetivos modificados: " + JSON.stringify(objetivosModificados));
  
  var sheet = SpreadsheetApp.openById('1tGEUndk0_iEQpfI7ZUBUSisjLkytru4t1kenX-ry3Yo').getSheetByName('Objetivos');
  var data = sheet.getDataRange().getValues();
  var fechaActual = formatearFecha(new Date()); // Formato dd/mm/aaaa

  for (var i = 0; i < objetivosModificados.length; i++) {
    var obj = objetivosModificados[i];

    for (var j = 1; j < data.length; j++) {
      if (data[j][1] == obj.idObjetivo) {
        // Comparamos los valores actuales con los nuevos
        var filaActual = data[j];
        var cambioDetectado = (
          filaActual[0] != obj.fecha ||
          filaActual[2] != obj.areaUsuario ||
          filaActual[3] != obj.idUsuario ||
          filaActual[4] != obj.nombreUsuario ||
          filaActual[5] != obj.descripcion ||
          filaActual[6] != obj.aprobado || // Comprobamos si cambió el valor de "Aprobado"
          filaActual[7] != obj.status || // Comprobamos si cambió el valor de "Status"
          filaActual[8] != obj.evidencia ||
          filaActual[9] != obj.cargoUsuario
        );

        if (cambioDetectado) {
          Logger.log("Cambio detectado en la fila " + (j + 1) + ": " + JSON.stringify(obj));
          // Si hay cambios, actualizamos solo esa fila
          sheet.getRange(j + 1, 1, 1, 11).setValues([[ 
            obj.fecha,
            obj.idObjetivo,
            obj.areaUsuario,
            obj.idUsuario,
            obj.nombreUsuario,
            obj.descripcion,
            obj.aprobado,  // Aseguramos que se actualiza "Aprobado"
            obj.status,  // Aseguramos que se actualiza "Status"
            obj.evidencia,
            obj.cargoUsuario,
            fechaActual  // Actualizamos solo la fecha de la fila modificada
          ]]);
        }
        break;
      }
    }
  }
  Logger.log("Actualización de objetivos completada.");
}

// Guardar un nuevo objetivo en la hoja de cálculo "Objetivos"
function guardarNuevoObjetivoEnSheet(objetivo) {
  Logger.log("Guardando nuevo objetivo: " + JSON.stringify(objetivo));
  
  var sheet = SpreadsheetApp.openById('1tGEUndk0_iEQpfI7ZUBUSisjLkytru4t1kenX-ry3Yo').getSheetByName('Objetivos');
  var fechaActual = formatearFecha(new Date()); // Fecha actual en formato dd/mm/aaaa

  var nuevaFila = [
    objetivo.fecha,
    objetivo.idObjetivo,
    objetivo.areaUsuario,
    objetivo.idUsuario,
    objetivo.nombreUsuario,
    objetivo.descripcion,
    objetivo.aprobado,
    objetivo.status,
    objetivo.evidencia,
    objetivo.cargoUsuario,
    fechaActual  // Fecha actual para la columna "Fecha Actualizada"
  ];

  sheet.appendRow(nuevaFila);  // Añadimos una nueva fila a la hoja
  Logger.log("Nuevo objetivo añadido a la hoja.");
}
