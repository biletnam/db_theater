var fs = require("fs");
var ejs = require("ejs");
var mysql = require("mysql");
var app = require("express")();
//var bodyParser = require("body-parser");
var http = require("http").Server(app);
var io = require("socket.io")(http);


var sqlserver = mysql.createConnection({
  user: "root",
  password:"****",
  database:"testcinema"
});

//app.use(bodyParser.urlencoded({extended:false}));

//for heroku => http.listen(process.env.PORT || 52273, ....
http.listen(3000, function(){
  console.log("server is up! at 3000");
});

app.get("/",function(req,res){
  fs.readFile("main.ejs","utf-8",function(err, pagedata){
    sqlserver.query("SELECT * FROM seats;",function(err,sqldata){
      res.send(ejs.render(pagedata,{data:sqldata}));
    });
  });
});

//test both ajax comm & regular comm
app.get("/buy/:id",function(req,res){
  fs.readFile("buy.ejs",function(err,pagedata){
    sqlserver.query("SELECT * FROM seats WHERE seatid=" + req.params.id + ";",function(err,sqldata){
      res.send(ejs.render(pagedata,{data:sqldata}));
    });
  });
});

app.get("/check/:id",function(req,res){
  fs.readFile("check.ejs",function(err,pagedata){
    sqlserver.query("SELECT buyer FROM seats WHERE seatid=" + req.params.id + ";",function(err,sqldata){
      res.send(ejs.redner(pagedata,{data:sqldata}));
    });
  });
});

io.on("connection",function (client){
  console.log("user connected: " + client.id);
  client.on("disconnect",function(){
    console.log("user disconnected: " + client.id);
  });

  client.on("book",function(sockdata){
    //console.log(sockdata);
    sqlserver.query("SELECT * FROM buyers WHERE name=? and phone=?;",[sockdata.name,sockdata.phone],function(err,result){
      console.log(result.length);
      if (result.length < 1){
        sqlserver.query("INSERT INTO buyers (name,phone) VALUES (?,?);",[sockdata.name,sockdata.phone],function(){
          sqlserver.query("SELECT buyerid FROM buyers WHERE name=? and phone=?;",[sockdata.name,sockdata.phone],function(err,targetUser){
            sqlserver.query("UPDATE seats SET buyer=? WHERE seatid=?;",[targetUser[0].buyerid,sockdata.seatid],function(){
              client.emit("refresh");
            });
          });
        });
      }else{
        console.log(result);
        sqlserver.query("UPDATE seats SET buyer=? WHERE seatid=?;",[result[0].buyerid,sockdata.seatid],function(){
            client.emit("refresh");
        });
      }
    });
  });

  client.on("cancel",function(sockdata){
    //sockdata = {seatid,phone}
    sqlserver.query("SELECT buyer FROM seats WHERE seatid=" + sockdata.seatid + ";",function(err,result){
      sqlserver.query("SELECT phone FROM buyers WHERE buyerid=" + result[0].buyer + ";",function(err,resPhone){
        console.log(resPhone);
        if (resPhone[0].phone === sockdata.phone){
          sqlserver.query("UPDATE seats SET buyer=NULL WHERE seatid=" + sockdata.seatid + ";",function(){
            client.emit("refresh");
          });
        }else{
          console.log("wrong phone number");
          client.emit("wrongphone");
        }
      });
    });
  });

  //a mysql query response always comes in an array form(doesn't matter if it's a single row answer)
  //from client side:socket.emit("check",seatno,function(sockres){ sockres == response });
  client.on("check",function(sockdata,sockres){
    sqlserver.query("SELECT buyer FROM seats WHERE seatid=" + sockdata + ";",function(err,resUser){
      console.log("identification request on userid " + resUser[0].buyer);
      sqlserver.query("SELECT * FROM buyers WHERE buyerid=" + resUser[0].buyer + ";", function(err, resSql){
        console.log("=> " + resSql[0].name);
        //var tempRes = {name:resSql.name,phone:resSql.phone};
        sockres({name:resSql[0].name,phone:resSql[0].phone});
      });
    });
  });

});

app.get("/data", function(req,res){
  sqlserver.query("SELECT * FROM seats;",function (error,data){
    res.send(data);
  });
});
