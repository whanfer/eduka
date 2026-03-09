// ============================================
        // CONFIGURACIÓN - IMPORTANTE: CONFIGURAR ESTO
        // ============================================
        
        // 1. URL del Web App de Google Sheets (obtendrás esto después de configurar)
        const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxvUFc0ehA4RZ0yTGsxJXswYt31ZMkwVGPS6Fqm73453CCoo1kuJ4eanIkHl1mS8xUY/exec';
        
        // 2. Número de WhatsApp de la profesora (formato: código país + número sin espacios)
        const WHATSAPP_NUMBER = '573107102757';
        
        // 3. Credenciales de administración
        const ADMIN_CREDENTIALS = {
            user: 'profe',
            pass: 'eduka2024'
        };

        // ============================================
        // CÓDIGO PRINCIPAL - NO MODIFICAR
        // ============================================

        let students = [];
        let isLoading = false;

        // Hamburger menu functionality
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('navMenu');
        const navOverlay = document.getElementById('navOverlay');
        const navLinks = document.querySelectorAll('.nav-menu a');

        function toggleMenu() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            navOverlay.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        }

        function closeMenu() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            navOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        hamburger.addEventListener('click', toggleMenu);
        navOverlay.addEventListener('click', closeMenu);
        
        navLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        // ============================================
        // FUNCIONES PARA GOOGLE SHEETS
        // ============================================

        // Cargar estudiantes desde Google Sheets
        async function loadStudentsFromSheet() {
            if (GOOGLE_SCRIPT_URL === 'TU_URL_DEL_SCRIPT_AQUI') {
                console.warn('⚠️ Google Sheets no configurado. Usando almacenamiento local.');
                students = JSON.parse(localStorage.getItem('edukaStudents')) || [];
                return;
            }

            try {
                isLoading = true;
                const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getStudents');
                
                // Intentar parsear la respuesta
                const text = await response.text();
                const data = JSON.parse(text);
                
                if (data.status === 'success') {
                    students = data.students;
                    // Sincronizar con localStorage
                    localStorage.setItem('edukaStudents', JSON.stringify(students));
                } else {
                    throw new Error(data.message || 'Error al cargar datos');
                }
            } catch (error) {
                console.error('Error cargando desde Google Sheets:', error);
                // Usar datos locales como respaldo
                students = JSON.parse(localStorage.getItem('edukaStudents')) || [];
            } finally {
                isLoading = false;
            }
        }

        // Guardar estudiante en Google Sheets
        async function saveStudentToSheet(student) {
            if (GOOGLE_SCRIPT_URL === 'TU_URL_DEL_SCRIPT_AQUI') {
                // Modo local si no está configurado
                students.push(student);
                localStorage.setItem('edukaStudents', JSON.stringify(students));
                return true;
            }

            try {
                // Crear formulario para evitar CORS
                const formData = new URLSearchParams();
                formData.append('action', 'addStudent');
                formData.append('student', JSON.stringify(student));

                // Enviar con fetch usando mode: no-cors
                fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    body: formData
                }).catch(err => console.log('Enviado a Google Sheets'));

                // Agregar localmente también
                students.push(student);
                localStorage.setItem('edukaStudents', JSON.stringify(students));
                
                return true;
            } catch (error) {
                console.error('Error guardando estudiante:', error);
                // Guardar localmente como respaldo
                students.push(student);
                localStorage.setItem('edukaStudents', JSON.stringify(students));
                return true;
            }
        }

        // Actualizar estudiante en Google Sheets
        async function updateStudentInSheet(id, updates) {
            if (GOOGLE_SCRIPT_URL === 'TU_URL_DEL_SCRIPT_AQUI') {
                const student = students.find(s => s.id === id);
                if (student) {
                    Object.assign(student, updates);
                    localStorage.setItem('edukaStudents', JSON.stringify(students));
                }
                return true;
            }

            try {
                const formData = new URLSearchParams();
                formData.append('action', 'updateStudent');
                formData.append('id', id);
                formData.append('updates', JSON.stringify(updates));

                fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    body: formData
                }).catch(err => console.log('Actualizado en Google Sheets'));

                // Actualizar localmente
                const student = students.find(s => s.id === id);
                if (student) {
                    Object.assign(student, updates);
                    localStorage.setItem('edukaStudents', JSON.stringify(students));
                }
                
                return true;
            } catch (error) {
                console.error('Error actualizando estudiante:', error);
                const student = students.find(s => s.id === id);
                if (student) {
                    Object.assign(student, updates);
                    localStorage.setItem('edukaStudents', JSON.stringify(students));
                }
                return true;
            }
        }

        // Eliminar estudiante de Google Sheets
        async function deleteStudentFromSheet(id) {
            if (GOOGLE_SCRIPT_URL === 'TU_URL_DEL_SCRIPT_AQUI') {
                students = students.filter(s => s.id !== id);
                localStorage.setItem('edukaStudents', JSON.stringify(students));
                return true;
            }

            try {
                const formData = new URLSearchParams();
                formData.append('action', 'deleteStudent');
                formData.append('id', id);

                fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    body: formData
                }).catch(err => console.log('Eliminado de Google Sheets'));

                // Eliminar localmente
                students = students.filter(s => s.id !== id);
                localStorage.setItem('edukaStudents', JSON.stringify(students));
                
                return true;
            } catch (error) {
                console.error('Error eliminando estudiante:', error);
                students = students.filter(s => s.id !== id);
                localStorage.setItem('edukaStudents', JSON.stringify(students));
                return true;
            }
        }

        // ============================================
        // FORMULARIO DE REGISTRO
        // ============================================

        document.getElementById('registrationForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                id: Date.now(),
                nombre: this.querySelector('input[type="text"]').value,
                edad: this.querySelector('input[type="number"]').value,
                padre: this.querySelectorAll('input[type="text"]')[1].value,
                telefono: this.querySelector('input[type="tel"]').value,
                email: this.querySelector('input[type="email"]').value,
                status: 'pending',
                fechaRegistro: new Date().toLocaleDateString('es-ES'),
                fechaActivacion: ''
            };

            // Mostrar loading
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '⏳ Enviando...';
            submitBtn.disabled = true;

            // Guardar en Google Sheets
            await saveStudentToSheet(formData);

            // Crear mensaje de WhatsApp
            const mensaje = `¡Hola! 👋

Nueva inscripción en EDUKA:

👤 *Estudiante:* ${formData.nombre}
🎂 *Edad:* ${formData.edad} años
👨‍👩‍👧 *Padre/Madre:* ${formData.padre}
📱 *Teléfono:* ${formData.telefono}
📧 *Email:* ${formData.email}
📅 *Fecha de registro:* ${formData.fechaRegistro}

💰 *Costo:* $100/mes

¿Me podrías enviar los medios de pago disponibles? 🙏`;

            // Abrir WhatsApp
            const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
            window.open(whatsappUrl, '_blank');

            // Mostrar confirmación
            alert('✅ ¡Registro exitoso!\n\nTu información ha sido enviada.\nEl estudiante quedará pendiente de aprobación hasta confirmar el pago.');
            
            this.reset();
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            await loadStudentsFromSheet();
            loadStudents();
        });

        // ============================================
        // ADMINISTRACIÓN
        // ============================================

        function adminLogin() {
            const user = document.getElementById('adminUser').value;
            const pass = document.getElementById('adminPass').value;

            if (user === ADMIN_CREDENTIALS.user && pass === ADMIN_CREDENTIALS.pass) {
                document.getElementById('adminLogin').style.display = 'none';
                document.getElementById('adminPanel').classList.add('active');
                loadStudentsFromSheet().then(() => loadStudents());
            } else {
                alert('❌ Usuario o contraseña incorrectos');
            }
        }

        function adminLogout() {
            document.getElementById('adminLogin').style.display = 'block';
            document.getElementById('adminPanel').classList.remove('active');
            document.getElementById('adminUser').value = '';
            document.getElementById('adminPass').value = '';
        }

        function showTab(tab) {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');

            document.querySelectorAll('.admin-content').forEach(c => c.classList.remove('active'));
            if (tab === 'pending') {
                document.getElementById('pendingContent').classList.add('active');
            } else {
                document.getElementById('activeContent').classList.add('active');
            }
        }

        function loadStudents() {
            const pendingGrid = document.getElementById('pendingStudentsGrid');
            const activeAdminGrid = document.getElementById('activeStudentsAdminGrid');
            const activePublicGrid = document.getElementById('activeStudentsGrid');

            const pendingStudents = students.filter(s => s.status === 'pending');
            const activeStudents = students.filter(s => s.status === 'active');

            // Pending Students
            if (pendingStudents.length === 0) {
                pendingGrid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">⏳</div>
                        <p>No hay estudiantes pendientes de aprobación.</p>
                    </div>
                `;
            } else {
                pendingGrid.innerHTML = pendingStudents.map(student => `
                    <div class="student-card">
                        <div class="student-header">
                            <div class="student-info">
                                <h3>👤 ${student.nombre}</h3>
                                <p>🎂 ${student.edad} años</p>
                                <p>👨‍👩‍👧 ${student.padre}</p>
                                <p>📱 ${student.telefono}</p>
                                <p>📧 ${student.email}</p>
                                <p>📅 ${student.fechaRegistro}</p>
                            </div>
                            <span class="status-badge status-pending">⏳ Pendiente</span>
                        </div>
                        <div class="student-actions">
                            <button class="action-btn btn-whatsapp" onclick="contactWhatsApp('${student.telefono}', '${student.nombre}')">
                                💬 WhatsApp
                            </button>
                            <button class="action-btn btn-activate" onclick="activateStudent(${student.id})">
                                ✅ Activar Plan
                            </button>
                            <button class="action-btn btn-delete" onclick="deleteStudent(${student.id})">
                                🗑️ Eliminar
                            </button>
                        </div>
                    </div>
                `).join('');
            }

            // Active Students (Admin View)
            if (activeStudents.length === 0) {
                activeAdminGrid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">✅</div>
                        <p>No hay estudiantes activos.</p>
                    </div>
                `;
            } else {
                activeAdminGrid.innerHTML = activeStudents.map(student => `
                    <div class="student-card">
                        <div class="student-header">
                            <div class="student-info">
                                <h3>👤 ${student.nombre}</h3>
                                <p>🎂 ${student.edad} años</p>
                                <p>👨‍👩‍👧 ${student.padre}</p>
                                <p>📱 ${student.telefono}</p>
                                <p>📧 ${student.email}</p>
                                <p>📅 Registrado: ${student.fechaRegistro}</p>
                                <p>✅ Activado: ${student.fechaActivacion}</p>
                            </div>
                            <span class="status-badge status-active">✅ Activo</span>
                        </div>
                        <div class="student-actions">
                            <button class="action-btn btn-whatsapp" onclick="contactWhatsApp('${student.telefono}', '${student.nombre}')">
                                💬 WhatsApp
                            </button>
                            <button class="action-btn btn-delete" onclick="deleteStudent(${student.id})">
                                🗑️ Eliminar
                            </button>
                        </div>
                    </div>
                `).join('');
            }

            // Active Students (Public View)
            if (activeStudents.length === 0) {
                activePublicGrid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📚</div>
                        <p>Aún no hay estudiantes activos registrados.</p>
                    </div>
                `;
            } else {
                activePublicGrid.innerHTML = activeStudents.map(student => `
                    <div class="student-card">
                        <div class="student-header">
                            <div class="student-info">
                                <h3>🌟 ${student.nombre}</h3>
                                <p>🎂 ${student.edad} años</p>
                                <p>📅 Estudiante desde: ${student.fechaActivacion}</p>
                            </div>
                            <span class="status-badge status-active">✅ Activo</span>
                        </div>
                    </div>
                `).join('');
            }

            updateCounts();
        }

        function updateCounts() {
            const pendingCount = students.filter(s => s.status === 'pending').length;
            const activeCount = students.filter(s => s.status === 'active').length;

            document.getElementById('pendingCount').textContent = pendingCount;
            document.getElementById('activeCount').textContent = activeCount;
        }

        async function activateStudent(id) {
            if (confirm('¿Confirmar que el pago fue realizado y activar el plan del estudiante?')) {
                const updates = {
                    status: 'active',
                    fechaActivacion: new Date().toLocaleDateString('es-ES')
                };
                
                await updateStudentInSheet(id, updates);
                await loadStudentsFromSheet();
                loadStudents();
                alert('✅ ¡Estudiante activado exitosamente!');
            }
        }

        async function deleteStudent(id) {
            if (confirm('¿Estás segura de que quieres eliminar este estudiante?')) {
                await deleteStudentFromSheet(id);
                await loadStudentsFromSheet();
                loadStudents();
                alert('🗑️ Estudiante eliminado');
            }
        }

        function contactWhatsApp(phone, name) {
            const mensaje = `Hola, me comunico respecto a la inscripción de *${name}* en EDUKA.`;
            const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`;
            window.open(whatsappUrl, '_blank');
        }

        // ============================================
        // ANIMACIONES Y EFECTOS
        // ============================================

        function createFloatingStars() {
            const sections = document.querySelectorAll('section');
            sections.forEach(section => {
                for (let i = 0; i < 3; i++) {
                    const star = document.createElement('span');
                    star.className = 'star-decoration';
                    star.textContent = ['⭐', '✨', '🌟', '💫'][Math.floor(Math.random() * 4)];
                    star.style.top = Math.random() * 100 + '%';
                    star.style.left = Math.random() * 100 + '%';
                    star.style.animationDelay = Math.random() * 2 + 's';
                    section.appendChild(star);
                }
            });
        }

        createFloatingStars();

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.subject-card, .feature-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'all 0.6s ease-out';
            observer.observe(card);
        });

        window.addEventListener('resize', function() {
            if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
                closeMenu();
            }
        });

        // ============================================
        // INICIALIZACIÓN
        // ============================================

        window.addEventListener('load', async function() {
            await loadStudentsFromSheet();
            loadStudents();
            updateCounts();
        });