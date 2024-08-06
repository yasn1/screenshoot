const getss = require("./getss.js");
const app = require("express")();

app.get('/screenshot', async (req, res) => {
  const url = req.query.site;
  const result = await getss(url);
  
  if (result.status === 200) {
      res.setHeader('Content-Type', 'image/png');
      res.send(Buffer.from(result.screenshot, 'base64'));
  } else {
      res.status(result.status).json(result);
  }
});

app.listen(8080,() => console.log("server listenin on 8080"))
