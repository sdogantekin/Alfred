/**
 * Created by serkand on 10/05/2016.
 */

$(document).ready(function() {
    $('#signInForm').bootstrapWizard({
        onTabShow: function(tab, navigation, index) {
            var $total = navigation.find('li').length;
            var $current = index+1;
            var $percent = ($current/$total) * 100;
            $('#signInForm .progress-bar').css({width:$percent+'%'});
            $('#signInForm').find('.bar').css({width:$percent+'%'});
        }
    });
    $('#signInForm .finish').click(function() {
        var username = $('#signInForm #username').val();
        var password = $('#signInForm #password').val();
        if(username == "" || password == "") {
            showModal("WARN","Please enter an username and a password", function(){
                $('#signInForm').find("a[href*='tab1']").trigger('click');
            });
        } else {
            signup();
        }
    });
    $("td .unselected").click( function() {
            $(this).toggleClass("selected");
    });
    $("td .selected").click( function() {
        $(this).toggleClass("unselected");
    });
});

$.ajaxSetup({complete: onRequestCompleted});

function onRequestCompleted(xhr,textStatus) {
    if (xhr.status == 302) {
        location.href = xhr.getResponseHeader("Location");
    }
}

function showLoginModal() {
    $('#loginModal').css("display","block");
}

function dismissLoginModal() {
    $('#loginModal').css("display","none");
}

function showSignUpModal() {
    $('#signUpModal').css("display","block");
}

function dismissSignUpModal() {
    $('#signUpModal').css("display","none");
}

function login() {
    var user = {};
    user.username    = $('#loginForm #username').val();
    user.password    = $('#loginForm #password').val();

    $.ajax({
        url: "/login2",
        data: JSON.stringify(user),
        type: "post",
        contentType: "application/json",
        success: function (response) {
            if (response.status == "success") {
                $('#liUser').html("<span class=\"glyphicon glyphicon-user\"></span>"+user.username);
                $('#liLogOp').html("<span class=\"glyphicon glyphicon-log-out\"></span>"+"Log Out");
                $('#liUser').attr("href", "/edit")
                $('#liLogOp').attr("href", "/logout")
                $('#discountTable').css("display","block");
                $('#discountLogin').css("display","none");
                dismissLoginModal();
                discount();
            } else {
                showModal("ERROR", response.message);
                $('#discountTable').css("display","none");
                $('#discountLogin').css("display","block");
            }
        }
    });
}

function showModal(type, text, callback) {
    switch (type) {
        case "INFO":
            $('#infoModal #modal-header').css('background-color', '#96ceb4');
            $('#infoModal #modal-title').html("INFO");
            break;
        case "WARN":
            $('#infoModal #modal-header').css('background-color', '#fc913a');
            $('#infoModal #modal-title').html("WARN");
            break;
        case "ERROR":
            $('#infoModal #modal-header').css('background-color', '#ff4e50');
            $('#infoModal #modal-title').html("ERROR");
            break;
        default:
            $('#infoModal #modal-header').css('background-color', 'white');
    }
    $("#infoModal #modal-text").html(text);
    if(callback) {
        $('#infoModal').on('hidden.bs.modal', function () {
            callback();
        });
    } else {
        $('#infoModal').on('hidden.bs.modal', function () {
        });
    }
    $("#infoModal").modal();
}

function search(text) {
    //log("");
    $('#discountTable').css('display', 'none');
    $("#discountTableBody").empty();
    $("#productTableBody").empty();
    $("#resultTableBody").empty();
    $.ajax({
            url: "/products/search",
            data: {
                input: text
            },
            type: "post",
            success: function (data) {
                //log(JSON.stringify(data));
                publishProductTable(data);
            }
        }
    );
}

function discount() {
    $("#discountTableBody").empty();
    $.ajax({
            url: "/products/discount",
            type: "post",
            success: function (data) {
                //log(JSON.stringify(data));
                publishDiscountTable(data);
            }
        }
    );
}

function publishProductTable(data) {
    var first = true;
    $.each(data["products"], function (index, item) {
        if (item.length > 0) {
            if(first) {
                $("#searchResultDiv").css('display', '');
                first = false;
            }
            var value = item[0];
            var productTableRow = "<tr>"
                + "<td>" + value.merchant + "</td>"
                + "<td>" + value.title + "</td>"
                + "<td>" + value.price + "</td>"
                + "</tr>";
            $("#productTableBody").append(productTableRow);
        }

        for (var index = 0; index < item.length; index++) {
            var value = item[index];
            var rowContent = "<tr>" +
                "<td>" + index + "</td>"
                + "<td>" + value.merchant + "</td>"
                + "<td>" + value.score + "</td>"
                + "<td>" + value._id + "</td>"
                + "<td>" + value.title + "</td>"
                + "<td>" + value.price + "</td>"
                + "<td>" + value.description + "</td>"
                + "<td>" + value.image_link + "</td>"
                + "<td>" + value.category + "</td>"
                + "<td>" + value.link + "</td>"
                + "</tr>";
            $("#resultTableBody").append(rowContent);
        }
    });
    if(data["discounts"]) {
        publishDiscountTable(data["discounts"]);
    }
}

function publishDiscountTable(data) {
    $('#discountTable').css('display', '');
    $.each(data, function (index, item) {
        var discountTableRow = "<tr>" + +"<td>" + item.merchant + "</td>"
            + "<td>" + item.merchant + "</td>"
            + "<td>" + item.title + "</td>"
            + "<td>" + item.price + "</td>"
            + "<td>" + item.discount + "</td>"
            + "<td>" + item.bonus + "</td>"
            + "</tr>";
        $("#discountTableBody").append(discountTableRow);
    });
}

function signup(source) {
    var user = {};
    user.username    = $('#signInForm #username').val();
    user.password    = $('#signInForm #password').val();
    user.age         = $('#signInForm #age').val();
    user.shoeSize    = $('#signInForm #shoe_size').val();
    user.clothSize   = $('#signInForm #cloth_size').val();
    $('#signInForm #gender').each(function (index) {
        if (this.checked) {
            user.gender = this.value;
        }
    });
    user.cards       = [];
    user.programs    = [];
    user.operators   = [];
    user.preferences = [];
    $('#signInForm #card').each(function (index) {
        if (this.checked) {
            user.cards.push({brand: this.name});
        }
    });
    $('#signInForm #program').each(function (index) {
        if (this.checked) {
            user.programs.push({item: this.name});
        }
    });
    $('#signInForm #operator').each(function (index) {
        if (this.checked) {
            user.operators.push({item: this.name});
        }
    });
    $('#signInForm #preference').each(function (index) {
        if (this.checked) {
            user.preferences.push({item: this.name});
        }
    });

    $.ajax({
        url: "/signup",
        data: JSON.stringify(user),
        type: "post",
        contentType: "application/json",
        success: function (response) {
            if (response.status == "success") {
                if(source && source == "LANDING") {
                    $('#liUser').html("<span class=\"glyphicon glyphicon-user\"></span>"+user.username);
                    $('#liLogOp').html("<span class=\"glyphicon glyphicon-log-out\"></span>"+"Log Out");
                    $('#liUser').attr("href", "/edit")
                    $('#liLogOp').attr("href", "/logout")
                    $('#discountTable').css("display","block");
                    $('#discountLogin').css("display","none");
                    dismissSignUpModal();
                    discount();
                } else {
                    showModal("INFO", "User Created!",function(){window.location.href="/";});
                }
            } else {
                if(source && source == "LANDING") {
                    showModal("ERROR", response.message);
                    $('#discountTable').css("display","none");
                    $('#discountLogin').css("display","block");
                } else {
                    showModal("ERROR", response.message);
                }
            }
        }
    });
}

function updateProfile() {
    var profile = {};
    profile.username = $('#profileForm #username').val();
    profile.email = $('#profileForm #email').val();
    profile.welcomeMessage = $('#profileForm #welcomeMessage').val();
    profile.bio = $('#profileForm #bio').val();
    profile.cards = [];
    $('#profileForm #cards').each(function (index) {
        if (this.checked) {
            profile.cards.push({brand: this.name});
        }
    });

    $.ajax({
        url: "/edit",
        data: JSON.stringify(profile),
        type: "post",
        contentType: "application/json",
        success: function (response) {
            if (response.status == "success") {
                showModal("INFO", "User Info Updated Successfully!");
            } else {
                showModal("ERROR", "User Info Cannot Be Updated!");
            }
        }
    });
}

function cardChange(obj) {
    if (obj.checked) {
        $(obj).attr("test", "true");
    } else {
        $(obj).attr("test", "false");
    }
}