/*!
  Copyright (c) 2012
  Written by José Carlos Nieto <xiam@menteslibres.org>

  Licensed under the MIT License
  Redistributions of files must retain the above copyright notice.
*/
(
  function($) {


    $.screen = function() {
    
    };

    $.screen.current = -1;
    $.screen.size    = 0;
    $.screen.args    = [];
    $.screen.screens = [];
    $.screen.history = [];
    $.screen.t       = false;

    $.screen.transitions = {
      '_unselect': function(el, transition, speed) {
        $.screen.history.push($.screen.current);
        
        $(document.body).removeClass('on-'+$(el).attr('id'));
        
        $(el).removeClass('screen-hidden');
        $(el).screen('fire', 'unselect');
        
        $(el).transition(transition, speed, function() {
          $(this).addClass('screen-hidden');
          $(this).css({
            'top': 0,
            'left': 0,
            'opacity': 1
          });
          $(el).screen('fire', 'unload');
        });
      },
      '_select': function(el, transition, speed) {
        var curr = null;
        if ($.screen.t) {
          var curr = $.screen.screens[$.screen.current];
          $(curr).addClass('screen-hidden');
        };
        $.screen.current = $(el).data('screen-index');
        $.screen.t = true;
        
        $(document.body).addClass('on-'+$(el).attr('id'));

        $(el).screen('fire', 'select');
        $(el).removeClass('screen-hidden'); 
        
        $(el).transition(transition, speed, function() {
          document.location.hash = $(el).attr('id');
          $(el).screen('fire', 'load');
          $.screen.t = false;
        });
      },
      'puff': function(a) {
        var b = $.screen.at($.screen.current);

        if (b) {
          $.screen.transitions._unselect(
            b,
            {
              'scale': 1.4,
              'opacity': 0,
              'easing': 'ease',
              'duration': 'slow'
            }
          );
        };

        $(a).css('opacity', 0);

        $.screen.transitions._select(
          a,
          {
            'opacity': 1,
            'easing': 'ease',
            'duration': 'slow'
          }
        );
        
      },
      'slide-bottom': function(a) {
        var b = $.screen.at($.screen.current);

        if (b) {
          $.screen.transitions._unselect(
            b,
            {
              'top': -$.screen.height(),
              'easing': 'ease',
              'duration': 'slow'
            }
          );
        };

        $(a).css('top', $.screen.height());

        $.screen.transitions._select(
          a,
          {
            'top': 0,
            'easing': 'ease',
            'duration': 'slow'
          }
        );
        
      },
      'slide-right': function(a) {
        var b = $.screen.at($.screen.current);

        if (b) {
          $.screen.transitions._unselect(
            b,
            {
              'left': $.screen.width(),
              'easing': 'ease',
              'duration': 'slow'
            }
          );
        };

        $(a).css('left', -$.screen.width());

        $.screen.transitions._select(
          a,
          {
            'left': 0,
            'easing': 'ease',
            'duration': 'slow'
          }
        );
        
      },
      'slide-left': function(a) {
        var b = $.screen.at($.screen.current);

        if (b) {
          $.screen.transitions._unselect(
            b,
            {
              'left': -$.screen.width(),
              'easing': 'ease',
              'duration': 'slow'
            }
          );
        };

        $(a).css('left', $.screen.width());

        $.screen.transitions._select(
          a,
          {
            'left': 0,
            'easing': 'ease',
            'duration': 'slow'
          }
        );
        
      },
      'slide-top': function(a) {
        var b = $.screen.at($.screen.current);

        if (b) {
          $.screen.transitions._unselect(
            b,
            {
              'top': $.screen.height(),
              'easing': 'ease',
              'duration': 'slow'
            }
          );
        };

        $(a).css('top', -$.screen.height());

        $.screen.transitions._select(
          a,
          {
            'top': 0,
            'easing': 'ease',
            'duration': 'slow'
          }
        );
        
      },
      'dissolve': function(a) {
        var b = $.screen.at($.screen.current);

        if (b) {
          $.screen.transitions._unselect(
            b,
            {
              'opacity': 0,
              'easing': 'ease',
              'duration': 'slow'
            }
          );
        };

        $(a).css('opacity', 0);

        $.screen.transitions._select(
          a,
          {
            'opacity': 1,
            'easing': 'ease',
            'duration': 'slow'
          }
        );
      }
    };
    
    $.screen._click = function(ev) {
      var target = $(ev.currentTarget);
      
      var to = target.attr('href');

      if (to.substr(0, 1) == '#') {
        
        var transition = target.attr('data-transition') || $.screen.options.transition;

        switch (to) {
          case '#':
            return;
          break;
          case '#back':
            $.screen.back(transition);  
          break;
          case '#prev':
            $.screen.prev(transition);  
          break;
          case '#next':
            $.screen.next(transition);  
          break;
          default:
            if ($(to).length > 0) {
              $(to).screen('select', transition);
            } else {
              $.error('Slide '+to+' does not exists.');
            }
          break;
        };
        
        ev.preventDefault();

      };

    };


    $.screen.events = function() {
      if (!$.screen.__events) {
        $(document).bind(
          'keydown',
          function(ev) {
            
            var code = null;

            switch (ev.which) {
              case 37: case 72:
                code = 'left';
              break;
              case 38: case 75:
                code = 'up';
              break;
              case 39: case 76:
                code = 'right';
              break;
              case 40: case 74:
                code = 'down';
              break;
            };

            var current = $.screen.at($.screen.current);

            $(current).trigger(code+'arrow', ev);
          }
        );

        $(document).swipe({
          'threshold': 16,
          'swipe': function(ev, code) {
            // it feels more natural if we invert those directions.

            var revert = {
              'up':     'down',
              'down':   'up',
              'left':   'right',
              'right':  'left'
            };

            var current = $.screen.at($.screen.current);
            $(current).trigger(revert[code]+'arrow', ev);
          }
        });

        $(document).bind(
          'mousewheel',
          function(ev, delta) {
            if ($(ev.target).hasClass('slide-wrapper')) {

              if ($.screen._mousewheel) {
                window.clearTimeout($.screen._mousewheel);
              };
              
              var current = $.screen.at($.screen.current);
              
              if (!$.screen._scrollfn) {
                $.screen._scrollfn = function() {
                  if (delta < 0) {
                    $(current).trigger('scrolldown', ev);
                  } else {
                    $(current).trigger('scrollup', ev);
                  };
                };
              };

              $.screen._mousewheel = window.setTimeout($.screen._scrollfn, 200);
            };

          }
        );

        $.screen.__events = true;
      };
    };

    $.screen.set = function() {
      $.screen.args = [];
      for (var i = 0; i < arguments.length; i++) {
        $.screen.args.push(arguments[i]);
      };
    };

    $.screen.get = function() {
      return $.screen.args;
    };

    $.screen.adjust = function() {
      $('.screen-wrapper').css('width', $.screen.width());
      $('.screen-wrapper').css('height', $.screen.height());
      $('.screen-wrapper').each(
        function(i, el) {
          var slide = $(el).find('.slide');
          
          slide.css({
            'top': ($.screen.height() - slide.outerHeight(true)) / 2,
            'left': ($.screen.width() - slide.outerWidth(true)) / 2
          });

        }
      );
    };

    $.screen.back = function(transition) {
      if ($.screen.history.length > 0) {
        var last = $.screen.history.pop();
        $($.screen.at(last)).screen('select', transition || $.screen.options.transition);
      };
    };
    
    $.screen.prev = function(transition) {
      if ($.screen.current > 0) {
        return $($.screen.at($.screen.current - 1)).screen('select', transition || $.screen.options.transition);
      };
      return null;
    };

    $.screen.next = function(transition) {
      if (($.screen.current + 1) < $.screen.size) {
        return $($.screen.at($.screen.current + 1)).screen('select', transition || $.screen.options.transition);
      };
      return null;
    };
    
    $.screen.at = function(index) {
      if (index > -1) {
        return $.screen.screens[index];
      };
      return null;
    };

    $.screen.height = function() {
      return $(window).height();
    };
    
    $.screen.width = function() {
      return $(window).width();
    };

    $.screen.defaults = {
      'transition': 'dissolve'
    };
   
    var methods = {
      'init': function(options) {

        $.screen.options = $.extend(
          $.screen.defaults,
          options || { }
        );

        $(this).addClass('screen-wrapper');
        
        $.screen.screens  = $(this);
        $.screen.size     = $(this).length;

        $(this).each(
          function(i, el) {
            $(el).data('screen-index', i);
          }
        );
        
        $.screen.adjust();

        $(this).addClass('screen-hidden');

        $(this).delegate(
          'a',
          'click',
          $.screen._click
        );
        
        var first = $(this).first();
        first.screen('select');

        $.screen.events();

        return $(this);
      },
      'unwatch': function(ev) {
        $(this).data('screen-on'+ev, null); 
      },
      'watch': function(map) {
        for (var ev in map) {
          var fn = map[ev];
          $(this).data('screen-on'+ev, fn); 
        }
      },
      'listen': function(map) {

        for (var ev in map) {
          var fn = map[ev];
          
          if (fn instanceof $) {
            var _el = fn;
            fn = function(ev) {
              $(_el).screen('select');
              //ev.stopPropagation();
              ev.preventDefault();
            };
          };

          $(this).bind(ev, fn);
        } 
        return this;
      },
      'fire': function(ev) {
        var fn = $(this).data('screen-on'+ev); 
        if (fn) {
          return fn.apply(this);
        }
      },
      'bind': function(map) {
        for (var ev in map) {
          for (sel in map[ev]) {
            var fn = map[ev][sel];
            if (fn instanceof $) {
              var _el = fn;
              fn = function(ev) {
                $(_el).screen('select');
                //ev.stopPropagation();
                ev.preventDefault();
              };
            };
            $(this).delegate(sel, ev, fn);
          };
        };
        return this;
      },
      'select': function(transition) {

        if (!transition) {
          transition = $.screen.options.transition;
        };

        $.screen.transitions[transition](this);
      }
    };

    $.fn.screen = function(method) {
      if (methods[method]) {
        return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
      } else if (typeof method === 'object' || !method) {
        return methods.init.apply(this, arguments);
      } else {
        $.error('Method '+method+' does not exist on jQuery.screen');
      };
    };

  }
)(jQuery);
