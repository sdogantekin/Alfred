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
            /*
             log( ui.item ?
             "Selected: " + ui.item.value + " aka " + ui.item.id :
             "Nothing selected, input was " + this.value );
             */
        },

        html: true, // optional (jquery.ui.autocomplete.html.js required)

        // optional (if other layers overlap autocomplete list)
        open: function (event, ui) {
            $(".ui-autocomplete").css("z-index", 1000);
        }
    });
});