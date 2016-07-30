/**
 * Created by serkand on 10/05/2016.
 */
// http://www.pontikis.net/blog/jquery-ui-autocomplete-step-by-step
// http://api.jqueryui.com/autocomplete/#option-source

$(function () {
    $("#query_product").autocomplete({
        source: "/products/suggest",
        minLength: 2,
        select: function (event, ui) {
            $.ajax({
                url: "/products/suggest/increment",
                data: JSON.stringify({input: ui.item.id}),
                type: "post",
                contentType: "application/json",
                success: function (response) {
                    console.log("done");
                }
            });
        },
        html: true,
        open: function (event, ui) {
            $(".ui-autocomplete").css("z-index", 1000);
        }
    });
});