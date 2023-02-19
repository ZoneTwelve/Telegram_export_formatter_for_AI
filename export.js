#!/usr/bin/env node

const fs = require('fs');
let stream = fs.createWriteStream('output');
let data = JSON.parse(fs.readFileSync('result.json', 'utf8'))['messages'];
let mem = new Object();

for(let i = 0 ; i < data.length ; i++){
  let message = textParser(data[i]);
  //console.log( message );
  stream.write( message );
}

stream.close();


function textParser( message ){
	let { id, text, reply_to_message_id, sticker_emoji, from } = message;
	if( from == undefined )
    return '';
  let el = elementParser( text );
	let txt = sticker_emoji || el;
	
	mem[ id ] = message;
	let old = mem[reply_to_message_id] || { content: '' };
	let { content } = old;
	let head = reply_to_message_id ? `${from || '[[NAME]]'} reply to ${old.from || '[[NAME]]'}: ` : `${from || '[[NAME]]'}: `;

	let new_content = head + txt + '[[EOF]]\n';
	mem[ id ]['content'] = new_content;

	return `${content}${new_content}\n`;
}

function elementParser( el ){
	let _type = typeof( el );
	let known_type = {
		mention: getElementText,
		link: getElementText,
    strikethrough: getElementText,
    bot_command: getElementText,
    phone: retHIDE,
    email: retHIDE,
    mention_name: getElementText,
    text_link: ( el ) => `(${el.text})[${el.href}]`,
    italic: ( el ) => `__${el.text}__`,
    bold: ( el ) => `**${getElementText(el)}**`,
    code: ( el ) => '`' + getElementText(el) + '`',
    pre: ( el ) => '```' + getElementText(el) + '```',
    underline: ( el ) => `__${getElementText(el)}__`,
    spoiler: ( el ) => `||${getElementText(el)}||`,
		hashtag: ( el ) => ` ${getElementText(el)} `,

    // pay feature:
    custom_emoji: getElementText,
    cashtag: ( el ) => `[[cashtag]]${getElementText(el)}[[cashtag]]`,
	}
	switch( true ){
			case _type=='string':
				return el;
			break;
			case Array.isArray(el):
				// don't need this yet
				let result = [];
				for(let e of el)
					result.push( elementParser( e ) );
				return result.join("\n");
			break;
			case _type == "object":
				// known: mention, link
				let { type } = el;
				if( known_type[type] ){
					return known_type[type]( el );
				}else{
					return '[[UNK]]';
				}
			break;
			default:
				return '[[ERR]]';
	}
}

function retUNK(){
  return '[[UNK]]';
}

function retHIDE(){
  return '[[HIDE]]'
}

function getElementText( el ){
	return el['text'];
}
