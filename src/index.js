import puppeteer from 'puppeteer';
import fs from 'fs/promises';

/**
 *  data within dataPharm
 *    title,
 *    streetAddress,
 *    postalCode,
 *    addressLocality,
 *    region
 */
let dataPharm = [];

async function openWebPage() {
  // "headless: false" - see website
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('https://www.farmacias.es/');

  const municipalities = await page.evaluate(() => {
    const list = document.querySelectorAll('#pillotrasciudades div div ul li');
    const data = [...list].map((item) => {
      nameMpio = item.querySelector('a').innerText;
      url = item.querySelector('a').href;
      return { nameMpio, url };
    });
    return data;
  });

  console.log('Iniciando');

  for (const i of municipalities) {
    await page.goto(i.url);
    await pagination(page);

    console.log(
      `Ha cargado los datos de las farmacias de ${i.nameMpio} correctamente`
    );
  }

  // \x1b[33m TXT \x1b[0m - color
  console.log(`\x1b[33m Hay ${dataPharm.length} farmacias en España \x1b[0m`);
  await browser.close();

  await fs.writeFile('pharmacy.json', JSON.stringify(dataPharm));
  console.log(`\x1b[33m Datos guardados en pharmacy.json \x1b[0m`);
}

async function pagination(page) {
  while (true) {
    // Extract data
    extrPharm(page);

    // Pagination
    const nextPage = await page.evaluate(() => {
      let resp = null;

      const list = document.querySelectorAll(
        'ul.pagination.pagination-primary li'
      );
      const data = [...list].map((item) => {
        text = item.querySelector('a').innerText;
        url = item.querySelector('a').href;
        return { text, url };
      });

      for (const i of data) {
        if (i.text === '>') {
          resp = i.url;
        }
      }

      return resp;
    });

    //End while when pagination ends
    if (nextPage === null) break;

    await page.goto(nextPage);
  }
}

async function extrPharm(page) {
  const result = await page.evaluate(() => {
    const list = document.querySelectorAll(
      'div.col-lg-9.fichas > div > div > div > div:nth-child(1) > div.col-md-12, div.col-lg-8.col-md-8'
    );

    const data = [...list].map((item) => {
      title = item.querySelector(
        'h3.card-title a span[itemprop="name"]'
      ).innerText;
      streetAddress = item.querySelector(
        'p span[itemprop="streetAddress"]'
      ).innerText;
      postalCode = item.querySelector(
        'p span[itemprop="postalCode"]'
      ).innerText;
      addressLocality = item.querySelector(
        'p span[itemprop="addressLocality"]'
      ).innerText;
      region = item.querySelector('p span[itemprop="addressRegion"]').innerText;

      return {
        title,
        streetAddress,
        postalCode,
        addressLocality,
        region,
      };
    });

    return data;
  });

  result.forEach((element) => {
    dataPharm.push(element);
  });
}

openWebPage();
