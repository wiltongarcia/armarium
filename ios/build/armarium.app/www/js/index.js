populateDatabase = function (tx) {
    tx.executeSql('CREATE TABLE IF NOT EXISTS images ' + 
            '(id INTEGER PRIMARY KEY ASC, image TEXT, name TEXT,' +
                ' description TEXT, category TEXT, favorited BOOL, timestamp DATETIME)');    
};

var db = window.openDatabase('armarium', '1.0', 'Armarium', 5 * 1024 * 1024);
db.transaction(populateDatabase);
list = [];
load = function (tx) {
    tx.executeSql('SELECT * FROM images', [],function (tx,r) {
        for (var i = 0, l = r.rows.length; i < l; i++)
        {
            list.push(r.rows.item(i));
        }
        angular.element(document).ready(function() {
             angular.bootstrap(document);
        });          
        
        $(".handle").each(function(){this.style.width = (400 * list.length) + "px";});

        slideshow = new Dragdealer('slideshow',{
            steps: list.length,                                            
            loose: true,
            animationCallback: function(x, y)
            {
                //console.log(x);
               // var top = x * (menuWrapper.offsetHeight - cursor.offsetHeight);
               // cursor.style.top = String(top) + 'px';
            }
          }); 
    });    
};
db.transaction(load);



var app = {
    pictureSource : '',
    destinationType : '',
    db : {},
    fileSystem : '',
    dataDir : '',

    initialize: function() {
        app.bind();
    },

    bind: function() {
        document.addEventListener('deviceready', app.deviceready, false);
    },

    deviceready: function() {
        app.report('deviceready');
        app.pictureSource = navigator.camera.PictureSourceType;
        app.destinationType = navigator.camera.DestinationType;

        buttonCapture = document.getElementById('capture');

        buttonCapture.addEventListener('click',app.capturePhoto, false);

        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
            app.fileSystem = fileSystem;
            app.fileSystem.root.getDirectory("armarium", {create: true},function (dataDir) {
                app.dataDir = dataDir;                
            });
        });

    },

    report: function(id) { 
        console.log("report:" + id);
    },

    onPhotoDataSuccess : function (imageData) {
   
      window.resolveLocalFileSystemURI(imageData, function(fileEntry) {
        console.log('name: ' + fileEntry.name);
        fileEntry.moveTo(app.dataDir, fileEntry.name, function (file) {
            var smallImage = document.getElementById('smallImage');
            smallImage.style.display = 'block';
            smallImage.src =  file.fullPath;
        });
      });
      
    },

    onFail : function (message) {
      app.report('Failed because: ' + message);
    },

    capturePhoto : function () {
        navigator.camera.getPicture(app.onPhotoDataSuccess, app.onFail, { quality: 50, 
            allowEdit: true,
            destinationType: app.destinationType.FILE_URI });
    },
    
};


var ImageListCtrl = function ($scope) {
    $scope.list = list;
    
    $scope.update = function () {
        var image = document.getElementById('smallImage');
        var name = document.getElementById('name');
        var description = document.getElementById('description');
        var category = document.getElementById('category');
        var favorited = document.getElementById('favorited');
                    
        var addedOn = new Date();
        var lastId = ($scope.list.length) ? $scope.list[$scope.list.length - 1].id : 0;
        $scope.list.push(
            {
                id:(lastId + 1),
                image: image.src,
                name: name.value, 
                description: description.value,
                category: category.value,
                favorited:favorited.checked,
                timestamp:addedOn
            }
        );

        $(".handle").each(function(){this.style.width = (400 * $scope.list.length) + "px";});

        slideshow.options.steps = $scope.list.length;




        db.transaction(
                function (tx) {
                    tx.executeSql(
                        'INSERT INTO images ' +
                            '(image, name, description, category, favorited, timestamp)' +
                                ' VALUES (?,?,?,?,?,?)',
                        [ 
                            image.src, 
                            name.value, 
                            description.value,
                            category.value,
                            favorited.checked,
                            addedOn
                        ],
                        $scope.init
                    );    
                }
        );
    };

    $scope.load = function (tx) {
        tx.executeSql('SELECT * FROM images', [],function (tx,r) {
            $scope.list = [];
            for (var i = 0, l = r.rows.length; i < l; i++)
            {
                $scope.list.push(r.rows.item(i));
            }
            
        });    
        tx.executeSql('SELECT DISTINCT category FROM images', [],function (tx,r) {
            $scope.categories = [];
            for (var i = 0, l = r.rows.length; i < l; i++)
            {
                $scope.categories.push(r.rows.item(i).category);
            }             
            $('#category').typeahead({source:$scope.categories});
        });    
    };
                          
    
    
    $scope.init = function () {
        db.transaction($scope.load)
    };

    $scope.init();

} 
