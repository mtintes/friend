#!/usr/bin/env node

import {Low, JSONFile} from 'lowdb'
import fs from 'fs'
import lodash from 'lodash'
import dateformat from 'dateformat'
import {homedir} from 'os'

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// a friend looks like this
// friend = {
//   name: 'friend',
//   likes: ['hats', 'pizza'],
//   birthday: new Date('December 10, 1990 03:24:00'),
//   }

const main = async (node, file, ...args ) => {

  let fileUrl = join(homedir(), '.friends.json')
  
  let property = getProperty(args.join(' '))

  let info = getInfo(args, property)
  
  let person = getPerson(args, property)
  
  if (fs.existsSync(fileUrl)) {

    const adapter = new JSONFile(fileUrl)
    const db = new Low(adapter)

    await db.read()

    db.chain = lodash.chain(db.data)

    let friend = db.chain
    .get('friends')
    .find({ name: person })
    .value()

    if (friend && info === "") {
      console.log(friend.name)
      if(friend.birthday) {
        console.log("birthday:", dateformat(friend.birthday, "mmmm d"))
      }
      if(friend.likes) {
        console.log("likes:")
        for (let like of friend.likes) {
          console.log(like)
        }
      }
      if(friend.gifts) {
        console.log("gifts:")
        for (let gift of friend.gifts) {
          console.log(gift)
        }
      }
    } else if (friend) {
      friend = updateProperty(property, info, friend)

      var index = db.chain.get('friends').find({ name: person }).indexOf(friend);

      db.data.friends.splice(index, 1, friend);

      await db.write()
    }else{
      let friend = {
        name: person
      }

      if (property) {
        if(property === 'likes'|| property === 'gifts') {
          friend[property] = [info]
        }else {
          friend[property] = info
        }
  
        db.data.friends.push(friend)
  
        await db.write()
      } else {
        console.log("I'm not sure what you needed. Try phrasing it as <PERSON> [likes, birthday, or gifts] <THING>. Or maybe there is just no info yet for that person?")
      }
    }
  } else {
    const adapter = new JSONFile(fileUrl)
    const db = new Low(adapter)

    db.data = {friends:[]}

    let friend = {
      name: person
    }

    if(property){
      if(property === 'likes'|| property === 'gifts') {
        friend[property] = [info]
      }else {
        friend[property] = info
      }

      db.data.friends.push(friend)

      await db.write()
    } else {
      console.log("I'm not sure what you needed. Try phrasing it as <PERSON> [likes, birthday, or gifts] <THING>")
    }
  }

}

const updateProperty = (property, info, friend) => {
  if(property === 'likes'|| property === 'gifts') {
    if(friend[property]) {
      friend[property].push(info)
      friend[property] = lodash.uniq(friend[property])
    } else {
      friend[property] = [info]
    }
  } else {
    friend = lodash.merge(friend, { [property]: info })
  }

  return friend
}

//if string contains "likes" return "likes" if string contains birthday return birthday
const getProperty = (string) => {
  if (string.includes('likes')) {
    return 'likes'
  } else if (string.includes('birthday')) {
    return 'birthday'
  } else if (string.includes('gifts')) {
    return 'gifts'
  } else {
    return null
  }
}

const getInfo = (args, property) => {
  let info = ""
  if (property){
    let index = args.indexOf(property)
    info = args.slice(index+1)
    info = info.join(' ')
    if( property === "birthday") {
      info = new Date(info)
    }
  } else {
    info = ""
  }

  return info
}

const getPerson = (args, property) => {
  let person = ""
  if (property) {
    let index = args.indexOf(property)
    return args.slice(0, index).join(' ')
  } else {
    return args.join(' ')
  }
}

const [ node, file, ...args ] = process.argv;
main(node, file, ...args)