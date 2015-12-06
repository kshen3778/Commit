var app = angular.module('test', ['ui.router']);


app.factory('tasks', ['$http', 'auth', function($http, auth){
    var o = {
      tasks: []  
    };
    
    //get all of user/org's tasks
    o.getAll = function(){
      return $http.get('/dashboard', {
        //pass JWT token
        headers: {Authorization: 'Bearer ' + auth.getToken()}
      }).success(function(data){
        angular.copy(data, o.tasks);   
      });
    };
    
    o.getAllOrg = function(){
      return $http.get('/orgdashboard', {
        //pass JWT token
        headers: {Authorization: 'Bearer ' + auth.getToken()}
      }).success(function(data){
        angular.copy(data, o.tasks);  
      });
    };
    
    
    //create a task
    o.create  = function(task){
      return $http.post('/tasks', task, {
        headers: {Authorization: 'Bearer ' + auth.getToken()}
      }).success(function(data){
         o.tasks.push(data); 
      });
    };
    
    
    //retrieve a single task
    o.get = function(id){
      return $http.get('/tasks/' + id).then(function(res){
        return res.data;
      });
    };
    
    //delete a task
    o.delete = function(task){
      return $http.delete('/tasks/' + task + '/delete' , {
        headers: {Authorization: 'Bearer ' + auth.getToken()}
      }).success(function(){

      });
    };
    
    //browse/list all tasks
    o.browse = function(){
      return $http.get('/browse/tasks').success(function(data){
        angular.copy(data, o.tasks);
      });
    };

    //edit a task
    o.editTask = function(task, edits){
      console.log(task);
      console.log("edits");
      console.log(edits);
      return $http.put('/tasks/' + task + '/edit', edits, {
        headers: {Authorization: 'Bearer ' + auth.getToken()}
      });
    };
    
    return o;
}]);

app.factory('taskrequests', ['$http', 'auth', function($http, auth){
  var r = {
      requests: []
  };
  
  r.submit = function(task, trequest){
    return $http.get('/tasks/' + task + '/submit', {
      headers: {Authorization: 'Bearer ' + auth.getToken()}
    }).success(function(data){
        r.requests.push(data);
    });
  };
  
  return r;

}]);

app.factory('auth', ['$http', '$window', function($http, $window){
    var auth = {};
    
    //save token into localstorage
    auth.saveToken = function(token){
      $window.localStorage['test-token'] = token;
    };
    
    //get token from localstorage
    auth.getToken = function(){
      return $window.localStorage['test-token'];  
    };
    
    //check if user is logged in
    auth.isLoggedIn = function(){
      console.log("logged in");
      var token = auth.getToken();
      if(token){
        var payload = JSON.parse($window.atob(token.split('.')[1]));
        return payload.exp > Date.now() / 1000;
      } else {
        return false;
      }
    };
    
    //return email of logged in user or org
    auth.currentUser = function(){
      if(auth.isLoggedIn()){
        var token = auth.getToken();
        var payload = JSON.parse($window.atob(token.split('.')[1]));
        return payload.email;
      }  
    };
    
    //return type of logged in entity
    auth.currentType = function(){
      if(auth.isLoggedIn()){
        var token = auth.getToken();
        var payload = JSON.parse($window.atob(token.split('.')[1]));
        //console.log("Payload type " + payload.type);
        return payload.type;
      }  
    }
    
    auth.isOrganization = function(){
      console.log(auth.currentType());
      return auth.currentType() === "organization";
    }
    
    auth.isUser = function(){
      console.log(auth.currentType());
      return auth.currentType() === "user";

    }
    
    //register the user and save token
    auth.register = function(user){
      return $http.post('/register', user).success(function(data){
         auth.saveToken(data.token); 
      });
    };
    
    //register the org and save token
    auth.registerOrg = function(org){
      return $http.post('/registerorg', org).success(function(data){
        auth.saveToken(data.token);
      });
    };
    
    //login user and save the token
    auth.logIn = function(user){
      return $http.post('/login', user).success(function(data){
        auth.saveToken(data.token); 
      });
    };
    
    //login an org
    auth.logInOrg = function(org){
      return $http.post('/loginorg', org).success(function(data){
        auth.saveToken(data.token);
      });
    };
    
    //logout and remove token
    auth.logOut = function(){
      $window.localStorage.removeItem('test-token');  
    };
    
    return auth;
}]);

//control user and tasks
app.controller('MainCtrl', [
    '$scope',
    'tasks',
    'auth',
    function($scope, tasks, auth){
        $scope.tasks = tasks.tasks; //task factory's tasks array
        $scope.isLoggedIn = auth.isLoggedIn;
        
        //add a new task
        $scope.addTask = function(){
          if(!$scope.name || $scope.name === ""){
              return;
          }  
          tasks.create({
             name: $scope.name,
             description: $scope.desc,
             hours: $scope.hours
          });
          $scope.name = "";
          $scope.desc = "";
          $scope.hours = "";
        };
    }
]);

//controls task search and browse
app.controller('BrowseCtrl', [
  '$scope',
  'tasks',
  'auth',
  function($scope, tasks, auth){
    $scope.tasks = tasks.tasks;
    $scope.isLoggedIn = auth.isLoggedIn;
  }
]);

//controller for navbar
app.controller('NavCtrl', [
'$scope',
'auth',
function($scope, auth){
  //expose methods from auth factory
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.currentType = auth.currentType;
  $scope.isOrganization = auth.isOrganization;
  $scope.logOut = auth.logOut;
}]);

app.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
  //$scope.user = {};
  
  //calls auth factory's register method
  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('dashboard');
    });
  };
  
  //calls auth factory's registerOrg method
  $scope.registerOrg = function(){
    auth.registerOrg($scope.org).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('orgdashboard'); //organization dashboard
    });
  };
  
  //calls the auth factory's login method
  $scope.logIn = function(){
    console.log("in AuthCtrl");
    console.log($scope.user);
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('dashboard'); //user dashboard
    });
  };
  
  //calls the auth factory's logInOrg method
  $scope.logInOrg = function(){
    auth.logInOrg($scope.org).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('orgdashboard');
    });
  };
  
}]);

//control a task's info
app.controller('TaskCtrl', [
'$scope',
'$state',
'tasks',
'task', //injected via the task state's resolve
'requests',
'request',
'auth',
function($scope, $state, tasks, task, requests, request, auth){
  $scope.task = task[0];
  $scope.orgname = task[1];
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.isOrganization = auth.isOrganization;
  $scope.isUser = auth.isUser;
  
  $scope.editTask = function(){
        console.log("Task id: " + task[0]._id);
        tasks.editTask(task[0]._id, {
          //body: $scope.body
          edits: {
            name: $scope.name,
            description: $scope.description,
            hours: $scope.hours
          }
        }).success(function(data){
          console.log("Success data: " + JSON.stringify(data));
          $scope.task.name = data.name;
          $scope.task.description = data.description;
          $scope.task.hours = data.hours;
          $state.go('task');
        });

        //$scope.body = '';

  };
  
  $scope.deleteTask = function(){
    tasks.delete(task[0]._id).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('orgdashboard');
    });
  };
  
  $scope.submitRequest = function(){
    requests.submit(task[0]._id, {
      name: $scope.name,
      email: $scope.email,
      school: $scope.school
    });
  };
  
}]);

app.controller('RequestCtrl', [
'$scope',
'$state',
'requests',
'request',
'auth',
function($scope, $state, requests, request, auth){
  $scope.request = request;
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.isOrganization = auth.isOrganization;
  $scope.isUser = auth.isUser;
  
  $scope.submit = function(){
    requests.submit(request._id, {
      name: $scope.name,
      email: $scope.email,
      school: $scope.school
    });
    
    $scope.name = "";
    $scope.email = "";
    $scope.school = "";
  };
}]);

app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider){
  
  //user dashboard state (get all tasks)
  $stateProvider.state('dashboard', {
    url: '/dashboard',
    templateUrl: 'partials/dashboard.html',
    controller: 'MainCtrl',
    resolve: {
      tasksPromise: ['tasks', function(tasks){
        return tasks.getAll();
      }]
    }
  });
  
  $stateProvider.state('browse', {
    url: '/browse/tasks',
    templateUrl: 'partials/browse.html',
    controller: 'BrowseCtrl',
    resolve: {
      tasksPromise: ['tasks', function(tasks){
        return tasks.browse();
      }]
    }
  });
  
  
  $stateProvider.state('orgdashboard', {
    url: '/orgdashboard',
    templateUrl: 'partials/orgdashboard.html',
    controller: 'MainCtrl',
    resolve: {
      tasksPromise: ['tasks', function(tasks){
        return tasks.getAllOrg();
      }]
    }
  });
  
  //task state (single task)
  $stateProvider.state('task', {
    url: '/tasks/{id}',
    templateUrl: 'partials/task.html',
    controller: 'TaskCtrl',
    resolve: {
      //injected into TaskCtrl
      task: ['$stateParams', 'tasks', function($stateParams, tasks){
        return tasks.get($stateParams.id);
      }]
    }
  });

  
  //user login state
  $stateProvider.state('login', {
    url: '/login',
    templateUrl: 'partials/login.html',
    controller: 'AuthCtrl',
    onEnter: ['$state', 'auth', function($state,auth){
      if(auth.isLoggedIn()){
        $state.go('dashboard');
      }
    }]
  });
  
  //organization login state
  $stateProvider.state('loginOrg', {
    url: '/loginOrg',
    templateUrl: 'partials/loginOrg.html',
    controller: 'AuthCtrl',
    onEnter: ['$state', 'auth', function($state, auth){
      if(auth.isLoggedIn()){
        $state.go('orgdashboard');
      }
    }]
  });
  
  $stateProvider.state('register', {
    url: '/register',
    templateUrl: 'partials/register.html',
    controller: 'AuthCtrl',
    onEnter: ['$state', 'auth', function($state,auth){
      if(auth.isLoggedIn()){
        $state.go('dashboard');
      }
    }]
  });
  
  $stateProvider.state('registerOrg', {
    url: '/registerOrg',
    templateUrl: 'partials/registerOrg.html',
    controller: 'AuthCtrl',
    onEnter: ['$state', 'auth', function($state, auth){
      if(auth.isLoggedIn()){
        $state.go('orgdashboard');
      }
    }]
  });
  
  $urlRouterProvider.otherwise('home');
  
}]);