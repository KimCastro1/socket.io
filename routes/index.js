const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Room = require('../schemas/room');
const Chat = require('../schemas/chat');

const router = express.Router();

try {
    fs.readdirSync('uploads');
} catch (error) {
    console.error('uploads folder not exist...');
    fs.mkdirSync('uploads');
}

const upload = multer({
    storage: multer.diskStorage({
        destination(req,file,done){
            done(null, 'uploads/');
        },
        filename(req,file,done){
            const ext = path.extname(file.originalname);
            done(null, path.basename(file.originalname,ext)+Date.now()+ext);
        },
    }),
    limits: {fileSize: 10*1024*1024},
});

router.post('/room/:id/gif', upload.single('gif'), async(req,res,next)=>{
    try {
        const chat = await Chat.create({
            room: req.params.id,
            user: req.session.color,
            gif: req.file.filename,
        });
        req.app.get('io').of('/chat').to(req.params.id).emit('chat',chat);
        res.send('ok');
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/', async(req,res,next)=>{
    try {
        const rooms = await Room.find({});
        res.render('main',{rooms, title:'채팅방'});
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/room', (req,res)=>{
    res.render('room', {tittle:'채팅방 생성'});
});

router.post('/room', async(req,res,next)=>{
    try {
        const newRoom = await Room.create({
            title: req.body.title,
            max: req.body.max,
            owner: req.session.color,
            password: req.body.password,
        });
        const io = req.app.get('io');
        io.of('/room').emit('newRoom', newRoom);
        res.redirect(`/room/${newRoom._id}?password=${req.body.password}`);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/room/:id', async(req,res,next)=>{
    try {
        const room = await Room.findOne({_id:req.params.id});
        const io = req.app.get('io');
        if(!room){
            return res.redirect('/?error=not exist room');
        }
        if(room.password&&room.password!==req.query.password){
            return res.redirect('/?error=invalid password');
        }
        const {rooms}=io.of('/chat').adapter;
        if(rooms&&rooms[req.params.id]&&room.max<=rooms[req.params.id].length){
            return res.redirect('/?error=member over!!!');
        }
        const chats = await Chat.find({room:room._id}).sort('createdAt');
        return res.render('chat',{
            room,
            title: room.title,
            chats,
            user: req.session.color,
        });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.delete('/room/:id', async(req,res,next)=>{
    try {
        await Room.remove({_id: req.params.id});
        await Chat.remove({room: req.params.id});
        res.send('ok');
        setTimeout(()=>{
            req.app.get('io').of('/room').emit('removeRoom',req.params.id);
        },2000)
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.post('/room/:id/chat',async(req,res,next)=>{
    try{
        const chat = await Chat.create({
            room:req.params.id,
            user:req.sessiom.color,
            chat:req.body.chat,
        });
        req.app.get('io').of('/chat').to(req.params.id).emit('chat',chat);
        res.send('ok');
    }
    catch(error){
        console.error(error);
        next(error);
    }
});

module.exports=router;