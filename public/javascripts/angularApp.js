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
    return $http.post('/tasks/' + task + '/submit', trequest, {
      headers: {Authorization: 'Bearer ' + auth.getToken()}
    }).success(function(data){
        r.requests.push(data);
    });
  };

  r.getAll = function(){
      return $http.get('/gettaskrequests', {
        //pass JWT token
        headers: {Authorization: 'Bearer ' + auth.getToken()}
      }).success(function(data){
        console.log("taskrequest route return: " + JSON.stringify(data));
        angular.copy(data, r.requests);
      });
  };

  r.getAllOrg = function(){
    return $http.get('/gettaskrequests/org', {
        //pass JWT token
        headers: {Authorization: 'Bearer ' + auth.getToken()}
    }).success(function(data){
        console.log("taskrequest org route return: " + JSON.stringify(data));
        angular.copy(data, r.requests);
    });
  }

  //retrieve a single taskrequest
  r.get = function(id){
      return $http.get('/taskrequests/' + id).then(function(res){
        return res.data;
      });
  };

  //edit a taskrequest
  r.editTaskRequest = function(taskrequest, edits){
    return $http.put('/taskrequests/' + taskrequest + '/edit', edits, {
      headers: {Authorization: 'Bearer ' + auth.getToken()}
    });
  };

  //delete a task
  r.delete = function(taskrequest){
      return $http.delete('/taskrequests/' + taskrequest + '/delete' , {
        headers: {Authorization: 'Bearer ' + auth.getToken()}
      });
  };

  r.isApproved = function(taskrequest){
    return $http.get('/taskrequests/' + taskrequest + '/approved' , {
        headers: {Authorization: 'Bearer ' + auth.getToken()}
    });
  };

  r.approve = function(taskrequest){
    console.log("approve " + taskrequest);
    return $http.put('/taskrequests/' + taskrequest + '/approve' , {
        headers: {Authorization: 'Bearer ' + auth.getToken()}
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
    };

    auth.isOrganization = function(){
      return auth.currentType() === "organization";
    };

    auth.isUser = function(){
      return auth.currentType() === "user";

    };

    //register the user and save token
    auth.register = function(user){
      return $http.post('/register', user).success(function(data){
         auth.saveToken(data.token);
      });
    };

    //register the org and save token
    auth.registerOrg = function(org){
      return $http.post('/registerorg', org).success(function(data){
        //auth.saveToken(data.token);
      });
    };

    auth.setPass = function(token, password){
      return $http.post('/setPass/' + token, {"password": password} ).success(function(data){

      });
    }

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

app.factory('account', ['$http', 'auth', function($http, auth){
    var account = {};

    account.editProfile = function(edits){
      console.log(edits);
      return $http.put('/profile/edit', edits, {
          headers: {Authorization: 'Bearer ' + auth.getToken()}
      }).success(function(data){
          console.log(data);
      });
    };

    account.currentUserObj = function(){

      var email = auth.currentUser();
      return $http.get('/user/' + email, {
          headers: {Authorization: 'Bearer ' + auth.getToken()}
      }).success(function(data){
          console.log(data);
          console.log(JSON.stringify(data));
          return data;
      });
    }

    return account;

}]);

//control user and tasks
app.controller('MainCtrl', [
    '$scope',
    'tasks',
    'taskrequests',
    'auth',
    function($scope, tasks, taskrequests, auth){
        $scope.tasks = tasks.tasks; //task factory's tasks array
        $scope.taskrequests = taskrequests.requests;
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.isApproved = taskrequests.isApproved;
        //console.log("tr approved " + JSON.stringify(taskrequests.isApproved(taskrequests.requests[0]._id)));
        console.log("TaskRequest Factory: " + JSON.stringify(taskrequests.requests));

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
'$location',
'auth',
function($scope, $state, $location, auth){
  //$scope.user = {};

  //calls auth factory's register method
  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('profile');
    });
  };

  //calls auth factory's registerOrg method
  $scope.registerOrg = function(){
    auth.registerOrg($scope.org).error(function(error){
      $scope.error = error;
    }).then(function(){
      $scope.msg = "An email has been sent. Please check your inbox to complete registration.";
      $state.go('orgdashboard'); //organization dashboard
    });
  };

  //calls the auth factory's login method
  $scope.logIn = function(){
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

  $scope.setPass = function(){
    var urlParts = $location.absUrl().split('/');
    var token = urlParts[urlParts.length - 1];
    auth.setPass(token, $scope.password).error(function(error){
      $scope.error = error;
    }).then(function(){
      $scope.msg = "Your account has been successfully created!";
      $state.go('loginOrg');
    });
  };

}]);

//control a task's info
app.controller('TaskCtrl', [
'$scope',
'$state',
'tasks',
'task', //injected via the task state's resolve
'taskrequests',
'auth',
function($scope, $state, tasks, task, taskrequests, auth){
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
            name: $scope.task.name,
            description: $scope.task.description,
            hours: $scope.task.hours
          }
        }).success(function(data){
          console.log("Success data: " + JSON.stringify(data));
          $scope.task.name = data.name;
          $scope.task.description = data.description;
          $scope.task.hours = data.hours;
          $state.go('task');
        });

  };

  $scope.deleteTask = function(){
    tasks.delete(task[0]._id).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('orgdashboard');
    });
  };

  $scope.submitRequest = function(){
    taskrequests.submit(task[0]._id, {
      name: $scope.name,
      email: $scope.email,
      school: $scope.school
    }).then(function(){
      console.log("TaskRequest Factory: " + JSON.stringify(taskrequests.requests));
      $state.go('dashboard');
    });
  };

}]);

app.controller('TaskRequestCtrl',[
'$scope',
'$state',
'taskrequests',
'taskrequest',
'auth',
function($scope, $state, taskrequests, taskrequest, auth){
  $scope.taskrequest = taskrequest;
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.isOrganization = auth.isOrganization;
  $scope.isUser = auth.isUser;
  //$scope.isApproved = taskrequests.isApproved(taskrequest._id);

  $scope.editTaskRequest = function(){
        taskrequests.editTaskRequest(taskrequest._id, {
          edits: {
            takername: $scope.taskrequest.takername,
            email: $scope.taskrequest.email,
            school: $scope.taskrequest.school
          }
        }).success(function(data){
          console.log("Success data: " + JSON.stringify(data));
          $scope.taskrequest.takername = data.takername;
          $scope.taskrequest.email = data.email;
          $scope.taskrequest.school = data.school;
          $state.go('taskrequest');
        });

  };

  $scope.deleteTaskRequest = function(){
    taskrequests.delete(taskrequest._id).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('dashboard');
    });
  };

  $scope.approve = function(){
    taskrequests.approve(taskrequest._id).success(function(data){
      $scope.taskrequest.approved = data.approved;

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

app.controller('ProfileCtrl', [
'$scope',
'$state',
'auth',
'account',
function($scope, $state, auth, account){
  $scope.isLoggedIn = auth.isLoggedIn;
  account.currentUserObj().then(function(user){
    console.log(user);
    $scope.user = user.data;
  });


  $scope.editProfile = function(){
    account.editProfile({
      edits: {
        name: $scope.user.name,
        email: $scope.user.email,
        phone: $scope.user.phone,
        school: $scope.user.school
      }
    }).success(function(data){
      console.log("Success data: " + JSON.stringify(data));
      $scope.user.name = data.name;
      $scope.user.email = data.email;
      $scope.user.phone = data.phone;
      $scope.user.school = data.school;
      //$state.go('profile');
    });
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
      }],


      taskrequestsPromise: ['taskrequests', function(taskrequests){
        return taskrequests.getAll();
      }]
      /*initialData: ["tasks", "taskrequests","$q", function (tk, tkr, $q) {
        return $q.all({
          tasks: tk.getAll(),
          taskrequests: tkr.getAll()
        });
      }]*/

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
      }],
      taskrequestsPromise: ['taskrequests', function(taskrequests){
        return taskrequests.getAllOrg();
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

  //taskrequest state (single taskrequest)
  $stateProvider.state('taskrequest', {
    url: '/taskrequests/{id}',
    templateUrl: 'partials/taskrequest.html',
    controller: 'TaskRequestCtrl',
    resolve: {
      //injected into TaskRequestCtrl
      taskrequest: ['$stateParams', 'taskrequests', function($stateParams, taskrequests){
        return taskrequests.get($stateParams.id);
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

  $stateProvider.state('createPassword', {
    url: '/createpassword/{token}',
    templateUrl: 'partials/setPass.html',
    controller: 'AuthCtrl',
    onEnter: ['$state', 'auth', function($state, auth){
      if(auth.isLoggedIn()){
        $state.go('orgdashboard');
      }
    }]
  });

  $stateProvider.state('profile', {
    url: '/profile',
    templateUrl: 'partials/profile.html',
    controller: 'ProfileCtrl'
  });

  $urlRouterProvider.otherwise('home');

}]);
