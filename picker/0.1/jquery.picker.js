/*!
  Copyright (c) 2012
  Written by José Carlos Nieto <xiam@menteslibres.org>

  Licensed under the MIT License
  Redistributions of files must retain the above copyright notice.
*/
(
  function($) {

    var methods = {
      'init': function() {
        return $(this).each(
          function() {

            $(this).addClass('number-picker');
            $(this).data('picker-index', 0);

            $(this).find('.more').click(
              function(ev) {
                var el = $(ev.currentTarget).closest('.number-picker');
                var current = el.picker('index');
                el.picker('choose', current + 1);
              }
            );
            
            $(this).find('.less').click(
              function(ev) {
                var el = $(ev.currentTarget).closest('.number-picker');
                var current = el.picker('index');
                el.picker('choose', current - 1);
              }
            );
          }
        );
      },
      /* Returns number of options */
      'options': function() {
        return $(this).find('ul li').length;
      },
      /* Returns or sets picker values */
      'index': function(index) {
        if (typeof index != 'undefined') {
          return $(this).data('picker-index', index);
        } else {
          return $(this).data('picker-index');
        };
      },
      /* Returns current picker value */
      'value': function() {
        var index = $(this).picker('index');
        var el = $(this).find('ul li')[index];
        return $(el).attr('data-value') || $(el).text();
      },
      /* Chooses an option */
      'choose': function(index) {
        var options = $(this).picker('options');
        var height  = parseInt($(this).find('.numbers').css('height'), 10);
        
        if (index < 0) {
          index += options;
        };

        var chosen  = index%options;

        $(this).picker('index', chosen)

        $(this).find('ul').animate({
          'top': -chosen*height
        });

      }
    };

    $.fn.picker = function(method) {
      if (methods[method]) {
        return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
      } else if (typeof method === 'object' || !method) {
        return methods.init.apply(this, arguments);
      } else {
        $.error('Method '+method+' does not exist on jQuery.picker');
      };
    };

  }
)(jQuery);
