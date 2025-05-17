const BASE64CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="

function base64decode(code) {
    let decode = []
    code = code.replace(/[^A-Za-z0-9\+\/\=]/g, "") //remove non-b64 chars

    for (let i = 0; i < code.length; i+=4) {
        const enc1 = BASE64CHARS.indexOf(code[i]);
        const enc2 = BASE64CHARS.indexOf(code[i+1]);
        const enc3 = BASE64CHARS.indexOf(code[i+2]);
        const enc4 = BASE64CHARS.indexOf(code[i+3]);

        if (enc1<0||enc2<0||enc3<0||enc4<0) return false

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 0b1111) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 0b11) << 6) | enc4;

        decode.push(chr1)

        if (enc3 != 64) {
            decode.push(chr2)
        }

        if (enc4 != 64) {
            decode.push(chr3)
        }
    }
    return decode
}

function base64encode(plain) {  //from array
    let code = ""
    for (let i = 0; i < plain.length; i +=3 ) {
        //xx000000 xx001111 xx111122 xx222222 
        let enc1 = plain[i] >> 2;
        let enc2 = ((plain[i] & 0b11) << 4) | (plain[i+1] >> 4);
        let enc3 = ((plain[i+1] & 0b1111) << 2) | (plain[i+2] >> 6);
        let enc4 = plain[i+2] & 0b111111;

        if (plain[i+1] === undefined) {
            enc3 = enc4 = 64;
        } else if (plain[i+2] === undefined) {
            enc4 = 64;
        }

        code += BASE64CHARS.charAt(enc1) + BASE64CHARS.charAt(enc2) + BASE64CHARS.charAt(enc3) + BASE64CHARS.charAt(enc4) 
    }
    return code
}