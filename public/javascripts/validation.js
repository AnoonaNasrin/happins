console.log("Hello world");

$(document).ready(function () {
    $("#login-form").validate({
      rules: {
        email: {
          required: true,
          email: true,
        },
        password: {
          required: true,
          minlength: 4,
        },
      },
    });
  });
  $(document).ready(function () {
    $("#signup-form").validate({
      rules: {
        name: {
          required: true,
          minlength: 4,
        },
        email: {
          required: true,
          email: true,
        },
        password: {
          required: true,
          minlength: 4,
        },
      },
    });
  });
  $(document).ready(function () {
    $("#admin-login").validate({
      rules: {
        email: {
          required: true,
          email: true,
        },
        password: {
          required: true,
          minlength: 4,
        },
      },
    });
  });
 