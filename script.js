document.addEventListener('DOMContentLoaded', () => {

    // Elements
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const step4 = document.getElementById('step-4');

    const formWelcome = document.getElementById('form-welcome');
    const formQuestionnaire = document.getElementById('form-questionnaire');

    const btnYes = document.getElementById('btn-yes');
    const btnNo = document.getElementById('btn-no');

    const displayName = document.getElementById('display-name');
    const youtubeLinkInput = document.getElementById('youtube-link');
    const forbiddenWordsInput = document.getElementById('forbidden-words');
    const activitiesInput = document.getElementById('activities');
    const activitiesError = document.getElementById('activities-error');

    // Data Storage
    let userData = {
        name: '',
        gender: '',
        attending: false,
        activities: '',
        songs: [],
        food: ''
    };

    // Helper to switch steps
    function showStep(hideElement, showElement) {
        hideElement.classList.remove('active');
        hideElement.classList.add('hidden');

        setTimeout(() => {
            showElement.classList.remove('hidden');
            showElement.classList.add('active');
        }, 100); // Small delay for smooth transition
    }

    // Step 1: Welcome Submit
    formWelcome.addEventListener('submit', (e) => {
        e.preventDefault();

        userData.name = document.getElementById('name').value.trim();
        userData.gender = document.getElementById('gender').value;

        displayName.textContent = userData.name;
        showStep(step1, step2);
    });

    // Reusable JSONBin save function
    async function saveToJSONBin(data) {
        const JSONBIN_API_KEY = '$2a$10$PRijnUhvQCRr8IE0ZgGEaeh.p0TE/aU5RD1Chvy2IKzxr6Dp.B7aS';
        const JSONBIN_BIN_ID = '6a294ef2da38895dfea62c18';

        let currentData = [];
        try {
            const resGet = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
                headers: { 'X-Master-Key': JSONBIN_API_KEY }
            });
            if (resGet.ok) {
                const json = await resGet.json();
                currentData = json.record || [];
                if (!Array.isArray(currentData)) currentData = [];
            }
        } catch (e) {
            console.warn("No se pudo leer datos antiguos", e);
        }

        data.timestamp = new Date().toISOString();
        currentData.push(data);

        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(currentData)
        });

        return response.ok;
    }

    // Step 2: Attendance Buttons
    btnYes.addEventListener('click', () => {
        userData.attending = true;
        showStep(step2, step3);
    });

    btnNo.addEventListener('click', async () => {
        userData.attending = false;
        const youtubeUrl = youtubeLinkInput.value;
        
        const originalText = btnNo.textContent;
        btnNo.textContent = 'Guardando...';
        btnNo.disabled = true;

        try {
            await saveToJSONBin(userData);
        } catch (e) {
            console.error("Error saving 'no' response", e);
        }

        // Redirect to youtube
        window.location.href = youtubeUrl;
    });

    // Validar palabras prohibidas
    function containsForbiddenWords(text) {
        const forbiddenString = forbiddenWordsInput.value;
        if (!forbiddenString) return false;

        const words = forbiddenString.split(',').map(w => w.trim().toLowerCase());
        const lowerText = text.toLowerCase();

        return words.some(word => lowerText.includes(word));
    }

    // Ocultar error cuando el usuario escribe
    activitiesInput.addEventListener('input', () => {
        activitiesError.classList.add('hidden');
    });

    // Step 3: Questionnaire Submit
    formQuestionnaire.addEventListener('submit', async (e) => {
        e.preventDefault();

        const activitiesText = activitiesInput.value.trim();

        if (containsForbiddenWords(activitiesText)) {
            activitiesError.classList.remove('hidden');
            return; // Detener el envío
        }

        userData.activities = activitiesText;
        userData.songs = [
            document.getElementById('song-1').value.trim(),
            document.getElementById('song-2').value.trim(),
            document.getElementById('song-3').value.trim()
        ];
        userData.food = document.getElementById('food').value.trim();

        // Enviar a JSONBin.io
        try {
            const btn = formQuestionnaire.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Enviando...';
            btn.disabled = true;

            const success = await saveToJSONBin(userData);

            if (success) {
                showStep(step3, step4);
            } else {
                alert('Hubo un error al guardar tu respuesta. Por favor intenta de nuevo.');
                btn.textContent = originalText;
                btn.disabled = false;
            }
        } catch (error) {
            console.error('Error:', error);
            alert('No se pudo conectar con el servidor.');
            const btn = formQuestionnaire.querySelector('button[type="submit"]');
            btn.textContent = 'Enviar Confirmación';
            btn.disabled = false;
        }
    });

});
