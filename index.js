const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const app = express();
const port = 3000;

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Web Scraper API',
            version: '1.0.0',
            description: 'A simple web scraping API',
        },
    },
    apis: ['./index.js'], // Ensure this points to your file with Swagger annotations
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /get-content:
 *   get:
 *     summary: Retrieve the content of a given URL
 *     description: Fetches and returns the HTML content of the specified URL.
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         description: URL to fetch content from
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: HTML content of the page
 *       400:
 *         description: URL parameter is missing
 *       500:
 *         description: Error in fetching URL
 */
app.get('/get-content', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // Remove script, style, and img tags
        $('script, style, img').remove();

        let textContent = "";

        $('body *').each(function() {
            let current = $(this).clone();
            current.children().remove();
            let text = current.text().trim();
            if (text) {
                textContent += text + '\n';
            }
        });

        return res.send(textContent);
    } catch (error) {
        return res.status(500).send('Error fetching the URL');
    }
});

/**
 * @swagger
 * /get-urls:
 *   get:
 *     summary: Retrieve all URLs from a given website
 *     description: Returns a list of all URLs found on the specified website.
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         description: Website URL to extract links from
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of URLs found on the page
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       400:
 *         description: URL parameter is missing
 *       500:
 *         description: Error in fetching URL
 */
app.get('/get-urls', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        let urls = [];
        $('a').each((i, link) => {
            urls.push($(link).attr('href'));
        });
        return res.json(urls);
    } catch (error) {
        return res.status(500).send('Error fetching the URL');
    }
});

app.listen(port, () => {
    console.log(`Scraper API running on http://localhost:${port}`);
});
