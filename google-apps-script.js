// ============================================
// SCRIPT DE GOOGLE APPS SCRIPT PARA EDUKA
// ============================================
// Este código se debe copiar en Google Apps Script

// Función principal que maneja todas las peticiones
// ============================================
// SCRIPT DE GOOGLE APPS SCRIPT PARA EDUKA
// ============================================
// Este código se debe copiar en Google Apps Script

// Función principal que maneja todas las peticiones
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getStudents') {
    return getStudents();
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'Acción no válida'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    let data;
    
    // Manejar diferentes formatos de datos
    if (e.postData && e.postData.contents) {
      // Intentar parsear como JSON
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonError) {
        // Si falla, parsear como parámetros de formulario
        const params = e.parameter;
        data = {
          action: params.action
        };
        
        if (params.student) {
          data.student = JSON.parse(params.student);
        }
        if (params.id) {
          data.id = params.id;
        }
        if (params.updates) {
          data.updates = JSON.parse(params.updates);
        }
      }
    } else {
      // Usar parámetros directamente
      data = e.parameter;
      if (data.student) data.student = JSON.parse(data.student);
      if (data.updates) data.updates = JSON.parse(data.updates);
    }
    
    const action = data.action;
    
    if (action === 'addStudent') {
      return addStudent(data.student);
    } else if (action === 'updateStudent') {
      return updateStudent(data.id, data.updates);
    } else if (action === 'deleteStudent') {
      return deleteStudent(data.id);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Acción no válida'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Obtener la hoja activa
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Estudiantes');
  
  // Si no existe, crear la hoja
  if (!sheet) {
    sheet = ss.insertSheet('Estudiantes');
    // Crear encabezados
    sheet.getRange(1, 1, 1, 8).setValues([[
      'ID',
      'Nombre',
      'Edad',
      'Padre/Madre',
      'Teléfono',
      'Email',
      'Estado',
      'Fecha Registro',
      'Fecha Activación'
    ]]);
    
    // Formatear encabezados
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold')
      .setBackground('#4CAF50')
      .setFontColor('#FFFFFF');
  }
  
  return sheet;
}

// Obtener todos los estudiantes
function getStudents() {
  try {
    const sheet = getSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        students: []
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    const students = data.map(row => ({
      id: row[0],
      nombre: row[1],
      edad: row[2],
      padre: row[3],
      telefono: row[4],
      email: row[5],
      status: row[6],
      fechaRegistro: row[7],
      fechaActivacion: row[8]
    }));
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      students: students
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Agregar un nuevo estudiante
function addStudent(student) {
  try {
    const sheet = getSheet();
    
    // Agregar nueva fila
    sheet.appendRow([
      student.id,
      student.nombre,
      student.edad,
      student.padre,
      student.telefono,
      student.email,
      student.status,
      student.fechaRegistro,
      student.fechaActivacion || ''
    ]);
    
    // Formatear la fila según el estado
    const lastRow = sheet.getLastRow();
    if (student.status === 'pending') {
      sheet.getRange(lastRow, 7).setBackground('#FFF3E0');
    } else if (student.status === 'active') {
      sheet.getRange(lastRow, 7).setBackground('#E8F5E9');
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Estudiante agregado correctamente'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Actualizar un estudiante
function updateStudent(id, updates) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    // Buscar el estudiante por ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        // Actualizar campos
        if (updates.status !== undefined) {
          sheet.getRange(i + 1, 7).setValue(updates.status);
          
          // Actualizar color según estado
          if (updates.status === 'active') {
            sheet.getRange(i + 1, 7).setBackground('#E8F5E9');
          }
        }
        
        if (updates.fechaActivacion !== undefined) {
          sheet.getRange(i + 1, 9).setValue(updates.fechaActivacion);
        }
        
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          message: 'Estudiante actualizado correctamente'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Estudiante no encontrado'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Eliminar un estudiante
function deleteStudent(id) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    // Buscar el estudiante por ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.deleteRow(i + 1);
        
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          message: 'Estudiante eliminado correctamente'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Estudiante no encontrado'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}