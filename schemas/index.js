const mongoose=require('mongoose');

const {MONGO_ID,MONGO_PASSWORD,MONGO_PORT,NODE_ENV}=process.env;
const MONGO_URL=`mongodb://${MONGO_ID}:${MONGO_PASSWORD}@localhost:${MONGO_PORT}/admin`;

const connect=()=>{
    if(NODE_ENV!=='production'){
        mongoose.set('debug',true);
    }
    mongoose.connect(MONGO_URL,{
        dbName:'chat',
        useNewUrlParser: true,
    }, (error)=>{
      if(error){
        console.log('mongoDB connection error accrued... ',error);
      }else{
        console.log('mongoDB connection success!');
      }
    });
};

mongoose.connection.on('error',(error)=>{
    console.error('MongoDB conection error accrued... ', error)
})
mongoose.connection.on('disconnected',()=>{
    console.error('MongoDB disconnect. connection retry')
    connect();
});

module.exports=connect;