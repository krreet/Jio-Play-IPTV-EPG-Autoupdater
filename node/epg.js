const https = require('https');
const zlib = require('zlib');
const xmlbuilder = require('xmlbuilder');

// Set up the EPG data structure
const epg = xmlbuilder.create('tv', { version: '1.0', encoding: 'UTF-8' });
epg.att('generator-info-name', 'Node.js');
const channelList = epg.ele('channel');
const programmeList = epg.ele('programme');

// Define the API URLs for the channel and programme data
const channelUrl = 'https://example.com/channels';
const programmeUrl = 'https://example.com/programmes';

// Make HTTP requests to fetch the channel and programme data
https.get(channelUrl, (res) => {
  let rawData = '';
  res.on('data', (chunk) => { rawData += chunk; });
  res.on('end', () => {
    const channelData = JSON.parse(rawData);
    channelData.forEach((channel) => {
      channelList.ele('channel', { id: channel.id }).ele('display-name', channel.name);
    });

    https.get(programmeUrl, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        const programmeData = JSON.parse(rawData);
        programmeData.forEach((programme) => {
          const programmeElem = programmeList.ele('programme', { start: programme.start, stop: programme.stop, channel: programme.channel });
          programmeElem.ele('title', programme.title);
          programmeElem.ele('desc', programme.description);
        });

        // Convert the EPG to XML and compress it with Gzip
        const xml = epg.end({ pretty: true });
        zlib.gzip(xml, (err, result) => {
          if (err) {
            console.error('Error compressing XML:', err);
          } else {
            // Write the compressed XML to a file
            const fs = require('fs');
            fs.writeFile('epg.xml.gz', result, (err) => {
              if (err) {
                console.error('Error writing file:', err);
              } else {
                console.log('EPG XML file created successfully.');
              }
            });
          }
        });
      });
    });
  });
});