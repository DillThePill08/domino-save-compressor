const $ = x => document.getElementById(x) 

function getByteWidth(num) {
    let bytewidth = 1
    if (num < 0) num = ~num
    while (Math.pow(2, bytewidth*8 - 1) <= num) bytewidth++
    return bytewidth
}

function numToSigned(num, bytewidth) {
    const negative = num < 0
    if (negative) num = ~num

    //convert to signed if need be
    let signed = num
    if (negative) signed ^= (Math.pow(2,bytewidth*8) - 1)

    //split into bytes
    let signedByteArray = []

    for (let i = bytewidth - 1; i >= 0; i--) {
        signedByteArray[i] = signed & 0b11111111
        signed >>= 8
    }

    return signedByteArray
}

function alert(msg) {
    $("output").innerHTML = msg
}

async function writeClipboard(txt) {
    try {
        await navigator.clipboard.writeText(txt)
    } catch(err) {
        $("codefailsafe").innerHTML = txt
    }
}

function signedToNum(signedByteArray) { 

    const negative = signedByteArray[0] >> 7 == 1 
    let num = 0
    
    for (let i = 0; i < signedByteArray.length; i++) {
        num += signedByteArray[i] << (8 * (signedByteArray.length - 1 - i))
    }

    if (negative) {
        num ^= Math.pow(2, signedByteArray.length * 8) - 1
        num = ~num
    }
    return num
}

//=============================================

const tileTypeOrder = [
    "OrthogonalDomino", //000
    "DiagonalDomino",   //001
    "ForkDomino",       //010
    "Crossover",        //011
    "Trigger"           //100
]

$("comp").onclick = async function() {
    $("codefailsafe").innerHTML = ""
    const plainSave = await navigator.clipboard.readText()

    const iterableTileData = plainSave.matchAll(/(\S+\s?){4}/g)

    let progress = 0
    const compressedData = []

    for (const tileStringData of iterableTileData) {

        progress += tileStringData[0].length
        console.log(progress / plainSave.length)

        const tileDataArray = tileStringData[0].match(/\S+/g)
        //byte0: .WWRRTTT
        //W = width of each coordinate in bytes + 1
        //W = position width per byte + 1
        //R = rotation (00 = east, 01 = north, 10 = west, 11 = south)
        //T = tile type (see tileTypeOrder)

        let byte0 = tileTypeOrder.findIndex(x => x == tileDataArray[0])
        if (byte0 == -1) return alert(`Compression Error: Invalid tile type "${tileDataArray[0]}"`) //invalid tile type,
        
        byte0 += (tileDataArray[3] % 4) << 3 //rotation
        
        //get coordinates and their byte widths
        const x = tileDataArray[1]
        const y = tileDataArray[2]
        const xWidth = getByteWidth(x)
        const yWidth = getByteWidth(y)
        const width = (yWidth > xWidth ? yWidth : xWidth)
    
        if (width > 4) { //width error
            const axis = (xWidth > 4 ? "X" : "Y")
            const axisMax = (axis == "X" ? x : y)
            return alert(`Compression Error: ${axis} coordinate exceeds 32 bits (${axisMax})`) //max out at 32 bits cuz js pmo
        }

        byte0 += (width - 1) << 5

        compressedData.push(byte0, ...numToSigned(x, width), ...numToSigned(y, width))
    }
    const code = base64encode(compressedData)
    alert(`Save code successfully compressed by ${Math.round((1 - code.length / plainSave.length) * 10000) / 100}%.`)
    writeClipboard(code)
    console.log(code)
}

$("decomp").onclick = async function() {
    $("codefailsafe").innerHTML = ""
    let encoded = await navigator.clipboard.readText()
    const compressedData = base64decode(encoded)

    if (!compressedData) return alert("Error: Save code is not valid Base64.")
    const decompressedData = []

    for (let i = 0; i < compressedData.length; ) {
        const byte0 = compressedData[i]
        let type = tileTypeOrder[byte0 & 0b111]
        let rotation = (byte0 >> 3) & 0b11
        let bytewidth = ((byte0 >> 5) & 0b11) + 1

        let xSigned = compressedData.slice(i + 1, i + bytewidth + 1)
        let ySigned = compressedData.slice(i + bytewidth + 1, i + 1 + bytewidth*2)

        decompressedData.push(type, signedToNum(xSigned), signedToNum(ySigned), rotation)
        i += 1 + bytewidth*2
    }
    const code = decompressedData.join(" ")
    alert(`Save code successfully decompressed by ${Math.round((code.length / encoded.length) * 10000) / 100}%.`)
    writeClipboard(code)
    console.log(code)
}

