
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function testUpload() {
    try {
        const form = new FormData();
        
        // Add fields
        form.append('question_text', 'Sample Question with Image');
        form.append('subjects', JSON.stringify(['Physics']));
        form.append('topics', JSON.stringify(['Mechanics']));
        form.append('options', JSON.stringify([{ id: '1', text: 'Opt 1' }, { id: '2', text: 'Opt 2' }]));
        form.append('answer', JSON.stringify({ correct_answer: '1' }));
        form.append('origin', JSON.stringify({ source: 'Test', year: 2024 }));
        form.append('existing_images', JSON.stringify([]));

        // Create a dummy image buffer if no file exists, or write one
        const dummyImagePath = path.join(process.cwd(), 'test_image.png');
        if (!fs.existsSync(dummyImagePath)) {
             // Create a simple 1x1 png or just some text content as a dummy file for testing flow 
             // (GCS might complain if it's not a real image if we validated mime, but simple buffer text is fine for storage test)
             fs.writeFileSync(dummyImagePath, 'dummy image content');
        }
        
        form.append('images', fs.createReadStream(dummyImagePath), {
            filename: 'test_image.png',
            contentType: 'image/png'
        });

        const headers = form.getHeaders();
        
        console.log('Sending request to http://localhost:8080/api/questions');

        const response = await axios.post('http://localhost:8080/api/questions', form, {
            headers: headers
        });

        console.log('Response Status:', response.status);
        console.log('Response Data:', response.data);
        
        // Clean up
        if (fs.existsSync(dummyImagePath)) {
            fs.unlinkSync(dummyImagePath);
        }

    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
        if(error.response) console.error(error.response.status);
    }
}

testUpload();
