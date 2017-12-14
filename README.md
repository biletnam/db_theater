# db_theater - seat bookings implementation

details
=======
- used ajax(socket.io/jquery) + mysql to implemente theater seat booking
- a user can check bookings status of rows of seats and cancel existing bookings or make a new booking
- check packages.json for dependencies

required mysql settings
========================
- table "buyers" values: buyerid-int(not null,auto increment, primary key), name-varchar(50), phone-varchar(50)
- table "seats" values: seatid-int(not null, auto increment, primary key), x-int, y-int, buyer-int