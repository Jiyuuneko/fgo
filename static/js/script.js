$(document).ready(function () {



  thumbs = $('.item.thumbnail')
  for (var i = 0; i < thumbs.length; i++) {
    thumb = $(thumbs[i])
    mtr_id = thumb.attr('data-item-id')

    var mtr = new Object();
    mtr.mtr_id = mtr_id
    var data = JSON.stringify(mtr)


    $.ajax({
      url: "/mtr_id_to_name/",
      type: "POST",
      data: data,
      success: function (data) {
        mtr = JSON.parse(data)
        mtr_name = mtr.mtr_name
        src = `https://img.fgowiki.com/fgo/material/${mtr_name}.jpg`
        thumb = thumb[0]
        thumb.setAttribute('src', src)
      }
    })


  }

  
})