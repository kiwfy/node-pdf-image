const expect = require('chai').expect;
const fs = require('fs');

const PDFImage = require('../').PDFImage;

describe('PDFImage', () => {
  const tmpDir = __dirname + '/tmp';
  const pdfFilePath = tmpDir + '/test.pdf';
  let generatedFiles = [];

  before(function (done) {
    fs.mkdirSync(tmpDir);
    fs.copyFileSync(__dirname + '/test.pdf', pdfFilePath);
    if (fs.existsSync(pdfFilePath)) {
      done();
    }
    throw Error('error to copy temp file');
  });

  beforeEach(function () {
    pdfImage = new PDFImage(pdfFilePath);
  });

  it('should return valide cmd string', function () {
    expect(pdfImage.validateCommandBreak('test.pdf')).equal('test.pdf');
    expect(pdfImage.validateCommandBreak('tmp/test.pdf')).equal('tmp/test.pdf');
    expect(pdfImage.validateCommandBreak('test_1.pdf')).equal('test_1.pdf');
    expect(pdfImage.validateCommandBreak('test$.pdf')).equal('test$.pdf');
    expect(pdfImage.validateCommandBreak('test*.pdf')).equal('test*.pdf');
    expect(pdfImage.validateCommandBreak('"test.pdf')).equal('"test.pdf');
    expect(pdfImage.validateCommandBreak('%test.pdf')).equal('%test.pdf');
  });

  it('should throw error to invalid path', function () {
    expect((() => {
      try {
        pdfImage.validateCommandBreak('test .pdf');
      } catch (e) {
        return e.message;
      }
    })()).equal('Command break input string, invalid characters detected');

    expect((() => {
      try {
        pdfImage.validateCommandBreak('test&.pdf');
      } catch (e) {
        return e.message;
      }
    })()).equal('Command break input string, invalid characters detected');

    expect((() => {
      try {
        pdfImage.validateCommandBreak('test>.pdf');
      } catch (e) {
        return e.message;
      }
    })()).equal('Command break input string, invalid characters detected');

    expect((() => {
      try {
        pdfImage.validateCommandBreak('test>.pdf');
      } catch (e) {
        return e.message;
      }
    })()).equal('Command break input string, invalid characters detected');

    expect((() => {
      try {
        pdfImage.validateCommandBreak('test;.pdf');
      } catch (e) {
        return e.message;
      }
    })()).equal('Command break input string, invalid characters detected');

    expect((() => {
      try {
        pdfImage.validateCommandBreak('test|.pdf');
      } catch (e) {
        return e.message;
      }
    })()).equal('Command break input string, invalid characters detected');

    expect((() => {
      try {
        pdfImage.validateCommandBreak('test$().pdf');
      } catch (e) {
        return e.message;
      }
    })()).equal('Command break input string, invalid characters detected');

    expect((() => {
      try {
        pdfImage.validateCommandBreak('test().pdf');
      } catch (e) {
        return e.message;
      }
    })()).equal('Command break input string, invalid characters detected');

    expect((() => {
      try {
        pdfImage.validateCommandBreak('test#.pdf');
      } catch (e) {
        return e.message;
      }
    })()).equal('Command break input string, invalid characters detected');
  });

  it('should have correct basename', function () {
    expect(pdfImage.pdfFileBaseName).equal('test');
  });

  it('should set custom basename', function () {
    pdfImage.setPdfFileBaseName('custom-basename');
    expect(pdfImage.pdfFileBaseName).equal('custom-basename');
  });

  it('should return correct page path', function () {
    expect(pdfImage.getOutputImagePathForPage(1))
      .equal('/app/tests/tmp/test-1.png');
    expect(pdfImage.getOutputImagePathForPage(2))
      .equal('/app/tests/tmp/test-2.png');
    expect(pdfImage.getOutputImagePathForPage(1000))
      .equal('/app/tests/tmp/test-1000.png');
    expect(pdfImage.getOutputImagePathForFile())
      .equal('/app/tests/tmp/test.png');
  });

  it('should return correct convert command', function () {
    expect(pdfImage.constructConvertCommandForPage(1))
      .equal('convert "/app/tests/tmp/test.pdf[1]" "/app/tests/tmp/test-1.png"');
  });

  it('should return correct convert command to combine images', function () {
    expect(pdfImage.constructCombineCommandForFile(['/app/tests/tmp/test-0.png', '/app/tests/tmp/test-1.png']))
      .equal('convert -append /app/tests/tmp/test-0.png /app/tests/tmp/test-1.png "/app/tests/tmp/test.png"');
  });

  it('should use gm when you ask it to', function () {
    pdfImage = new PDFImage(pdfFilePath, { graphicsMagick: true });
    expect(pdfImage.constructConvertCommandForPage(1))
      .equal('gm convert "/app/tests/tmp/test.pdf[1]" "/app/tests/tmp/test-1.png"');
  });

  it('should convert PDFs page to a file with the default extension', async function () {
    const imagePath = await pdfImage.convertPage(1);
    expect(imagePath).equal(tmpDir + '/test-1.png');
    expect(fs.existsSync(imagePath)).to.be.true;
    generatedFiles.push(imagePath);
  });

  it('should convert PDFs page 10 to a file with the default extension', async function () {
    const imagePath = await pdfImage.convertPage(9);
    expect(imagePath).equal(tmpDir + '/test-9.png');
    expect(fs.existsSync(imagePath)).to.be.true;
    generatedFiles.push(imagePath);
  });

  it('should convert PDFs page to file with a specified extension', async function () {
    pdfImage.setConvertExtension('jpeg');
    const imagePath = await pdfImage.convertPage(1);
    expect(imagePath).equal(tmpDir + '/test-1.jpeg');
    expect(fs.existsSync(imagePath)).to.be.true;
    generatedFiles.push(imagePath);
  });

  it('should convert all PDFs pages to files', async function () {
    const imagePath = await pdfImage.convertFile();
    imagePath.forEach((file) => {
      expect(fs.existsSync(file)).to.be.true;
      generatedFiles.push(file);
    });
  });

  it('should construct convert options correctly', function () {
    pdfImage.setConvertOptions({
      '-density': 300,
      '-trim': null
    });
    expect(pdfImage.constructConvertOptions()).equal('-density 300 -trim');
  });

  it('should convert all PDFs pages to single image', async function () {
    let pdfImageCombined = new PDFImage(pdfFilePath, {
      combinedImage: true,
    });
    const imagePath = await pdfImageCombined.convertFile();
    expect(imagePath).to.equal(tmpDir + "/test.png");
    expect(fs.existsSync(imagePath)).to.be.true;
    generatedFiles.push(imagePath);
  });

  it('should return # of pages', async function () {
    const pages = await pdfImage.numberOfPages();
    expect(parseInt(pages)).to.be.equal(10);
  });

  after(function () {
    const tmpFiles = fs.readdirSync(tmpDir);
    tmpFiles.forEach((file) => {
      fs.unlinkSync(`${tmpDir}/${file}`);
    });
    fs.rmdirSync(tmpDir);
  });

  afterEach(function () {
    generatedFiles.forEach((imagePath) => {
      fs.unlinkSync(imagePath);
    });
    generatedFiles = [];
  });
});
