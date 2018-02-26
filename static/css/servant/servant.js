$(document).ready(function(){

  $('.servant-class.Saber').addClass('active')
  $('#Saber').addClass('active')

  
  let heads = $('.flex-item.head a')
  let nums = new Array()
  for (let i = 0; i < heads.length; i++) {
    let num = $(heads[i]).attr('data_num');
    nums[i] = num;
  }
  //console.log(nums)
  


  
  let tbl = $('.tbl_servant');
  let trs = $('.tbl_servant tr[data_num]')
  trs.css('display','none')

  let calc = $('.calc')

  let result = $('.total.calc-result')

  $('.summation').on('click', function(){
    heads.toggleClass('sum')
    calc.toggle()
    if ($(heads[0]).hasClass('sum')) {
      heads.attr('href', 'javascript:;')
      tbl.css('display', 'table')
      bind_summation()
      result.show()

    } else {
      for (let i = 0; i < heads.length; i++) {
        $(heads[i]).attr('href', `servant/${nums[i]}.html`)
      }
      tbl.css('display', 'none')
      //let trs = $('.tbl_servant tr[data_num]')
      //trs.css('display','none')
      heads.off('click')
      result.hide()
    }
  })




  

  calc.on('click', function () {

    let [level_pairs, skill_pairs] = get_level_skill_pairs()
    // localStorage.clear()


    //console.log(skill_pairs)
    //$.ajaxSettings.async = false;
    Promise
      .all([get_break_data(), get_together_need(), get_qp_cost(), get_exps_calc()])
      .then(function (result) {
        return data_handler(result)
      })


    function data_handler(result) {
      let [break_data, together_datas, qp_cost, exps_data] = result

      let level_breaks = break_data_handler(break_data)

      set_local_storage('qp_cost', qp_cost)
      set_local_storage('break_data', break_data)
      set_local_storage('exps_data', exps_data)
      set_local_storage('together_datas', together_datas)

      together_data_handler(together_datas, level_breaks)

      exps_handler(exps_data)

      qp_cost_handler(qp_cost, level_breaks)
    }

    function qp_cost_handler (qp_cost, level_breaks) {
      let all_break_need_qp = 0
      for (let level_break of level_breaks) {
        let {breaks, star} = level_break
        let [low, high] = breaks
        let break_need_qp_list = qp_cost['break'][star]
        let break_need_qp = calc_exps(break_need_qp_list, breaks, 1)
        //console.log(break_need_qp)
        all_break_need_qp += break_need_qp
      }
      //console.log(all_break_need_qp)

      let all_skill_need_qp = 0
      for (let skill_pair of skill_pairs) {
        let {servant_skill_pairs, star} = skill_pair
        let skill_need_qp_list = qp_cost['skill'][star]
        for (let servant_skill_pair of servant_skill_pairs) {
          let break_need_qp = calc_exps(skill_need_qp_list, servant_skill_pair, 1)
          all_skill_need_qp += break_need_qp
        }
      }
      //console.log(all_skill_need_qp)

      let all_need_qp = all_break_need_qp + all_skill_need_qp
      all_need_qp = toThousands(all_need_qp)

      let result_div = $('.materials.calc-result')
      let need_qp = $(`<span class="material-wrapper">
                          <img class="item thumb" src="./static/images/material/qp.jpg">
                          <span style="position:relative; left:5.2vw; top:-2vw;">${all_need_qp}</span>
                        </span>`)
      result_div.append(need_qp)
    }

    function break_data_handler (break_data) {
      let level_breaks = []
      for (let level_pair of level_pairs) {
        level_break = level_to_break(level_pair, break_data)
        level_breaks.push(level_break)
      }
      return level_breaks
    }

    function together_data_handler (together_datas, level_breaks) {
      let result_div = $('.materials.calc-result')
      result_div.empty()
      //console.log(together_datas)
      let {data, ordered_ids} = together_datas
      let servants_skill_need = []
      for (let skill_pair of skill_pairs) {
        let {servant_id, servant_skill_pairs} = skill_pair
        let [bs_level_needs, total_needs, total] = data[servant_id]
        let [word, skill_needs] = bs_level_needs[1]
        //console.log(servant_skill_pairs)
        let servant_skill_need = calc_skill_pairs_needs(skill_needs, servant_skill_pairs)
        servants_skill_need.push(servant_skill_need)
      }

      let all_skill_need = servants_skill_need.reduce(push_items_together)
      //console.log(all_skill_need)

      
      let servants_break_need = []
      //console.log(level_breaks)
      for (let level_break of level_breaks) {
        let {servant_id, breaks} = level_break
        //console.log(breaks)
        let [bs_level_needs, total_needs, total] = data[servant_id]
        let [word, break_needs] = bs_level_needs[0]
        let servant_break_need = calc_skill_needs(break_needs, breaks)
        servants_break_need.push(servant_break_need)
      }

      let all_break_need = servants_break_need.reduce(push_items_together)
      //console.log(all_break_need)

      let all_need = push_items_together(all_skill_need, all_break_need)
      //console.log(all_need)
      all_need.sort((x, y) => ordered_ids.indexOf(x[0]) - ordered_ids.indexOf(y[0]))
      
      for (let need of all_need) {
        // let need_span = $(`<span class="material-wrapper">
        //                     <img class="item thumb" src="https://lordpmm.github.io/fgo/static/images/fgo/material/${need[1]}.jpg">
        //                     <span>${need[2]}</span>
        //                   </span>`)

        let need_span = $('<span class="material-wrapper"></span>')

        let src1 = `https://lordpmm.github.io/fgo/static/images/fgo/material/${need[1]}.jpg`
        let src2 = `./static/images/material/${need[1]}.jpg`
        let src = (need[1] === 'Kfc')? src2: src1

        let span_img = $('<img>', {
          class: 'item thumb',
          src: src
        })
        let span_num = $(`<span>${need[2]}</span>`)

        need_span.append(span_img)
        need_span.append(span_num)
        result_div.append(need_span)
      }
    }

    function exps_handler (data) {
      dog_foods = 0
      for (let servant_level_pair of level_pairs) {
        let {level_pair} = servant_level_pair
        let dog_food = calc_exps(data, level_pair)
        //console.log(calc_exps(data, level_pair))
        dog_foods += dog_food
      }
      let result_div = $('.materials.calc-result')
      let need_food = $(`<span class="material-wrapper">
                          <img class="item thumb" src="./static/images/material/dogfood.jpg">
                          <span>${dog_foods}</span>
                        </span>`)
      need_food.find('span').css('left', '0vw')
      result_div.append(need_food)
      //console.log(dog_foods)
    }


    function get_qp_cost () {
      let url = './static/json/extra/qp_cost.json'
      let name = 'qp_cost'
      return get_local_storage(name, url)

    }

    function get_break_data () {
      let url = './static/json/extra/star_break_levels.json'
      let name = 'break_data'
      return get_local_storage(name, url)
    }

    function get_together_need () {
      let url = './static/json/servant_need/together_need.json'
      let name = 'together_datas'
      return get_local_storage(name, url)
    }

    function get_exps_calc() {
      let url = './static/json/extra/levelup_exps_calc.json'
      let name = 'exps_data'
      return get_local_storage(name, url)
    }
  })

  let load_last = $('.load-last')
  load_last.on('click', function () {
    let last = get_local('last')

    let [level_pairs, skill_pairs] = last
    level_pairs.forEach( (level_pair, index) => {
      let servant_id = level_pair.servant_id

      let head = heads.filter(`[data_num='${servant_id}']`)
      // console.log(head.css('display'))
      if (head.css('display') == 'none') {
        $(`tr[data_num='${servant_id}'] .delete`).click()
      }
      head.trigger('click', [ level_pair, skill_pairs[index] ])
      
    })
  })


})

function get_level_skill_pairs() {
  let calc_trs = $(`tbody tr`)
  // get level gaps of servants
  let level_pairs = []
  for (let tr of calc_trs) {
    let num = $(tr).attr('data_num')
    let star = $(tr).find('input[data-star]').attr('data-star')
    let texts = $(tr).find(`td:eq(1) input[type='number']`)
    let broken = $(tr).find(`td:eq(1) input[type='checkbox']`).attr('checked')
    let level_pair = []
    for (let text of texts) {
      level_pair.push($(text).val())
    }
    let level_pair_b = {
      servant_id: num,
      star: star,
      broken: broken,
      level_pair: level_pair
    }
    level_pairs.push(level_pair_b)
  }
  //console.log(level_pairs)

  let skill_pairs = []
  for (let tr of calc_trs) {
    let num = $(tr).attr('data_num')
    let star = $(tr).find('input[data-star]').attr('data-star')
    let skill_inputs = $(tr).find('td:eq(2) .skill-input')
    let servant_level_pairs = []
    for (let skill_input of skill_inputs) {
      let texts = $(skill_input).find('input')
      let level_pair = []
      for (let text of texts) {
        val = $(text).val()
        level_pair.push(val)
      }
      servant_level_pairs.push(level_pair)
    }
    let servant = {
      servant_id: num,
      servant_skill_pairs: servant_level_pairs,
      star: star
    }
    skill_pairs.push(servant)
  }

  let result = [level_pairs, skill_pairs]

  set_local('last', result)

  return result

}

let valid_len_data = {
  'together_datas': 243425
}

function get_local_storage(name, url) {
  let local = localStorage[name]
  if (local !== undefined) {
    if ( (name in valid_len_data && local.length === valid_len_data[name]) || !(name in valid_len_data) ){
      return JSON.parse(local)
    }    
  }

  return $.getJSON({
      url: url,
      global: false
  })    


}

function set_local_storage(name, obj) {
  let local = localStorage[name]
  if (local === undefined || (name in valid_len_data && local.length !== valid_len_data[name])) {
    localStorage[name] = JSON.stringify(obj)
  }
}

function get_local(name) {
  return JSON.parse(localStorage[name])
}

function set_local(name, obj) {
  localStorage[name] = JSON.stringify(obj)
}

function toThousands(num) {  
  var num = (num || 0).toString(), result = '';  
  while (num.length > 3) {  
      result = ',' + num.slice(-3) + result;  
      num = num.slice(0, num.length - 3);  
  }  
  if (num) { result = num + result; }  
  return result;  
}  


function ajax(param, callback){  
  $.ajax({  
      url:param,  
      type:'get',  
      success:function(data){  
          callback(data);   
      },  
      error:function(data){  
          console.log('error');  
      }         
  })  
}  

function request(url){  
  return new Promise(function(resolve,reject){  
      ajax(url,resolve);    
  });  
}  

function level_to_break(level_pair_obj, break_levels){
  let {servant_id, star, broken, level_pair} = level_pair_obj
  let break_level = break_levels[star]
  let [low, high] = level_pair
  low = Number(low)
  high = Number(high)

  let breaks = []
  for (let i = 0; i < break_level.length; i++) {
    if (break_level[i] < high && break_level[i] > low) {
      breaks.push(i)
    }
    if (!broken && break_level[i] == low) {
      breaks.push(i)
    }
  }

  if (breaks.length === 0) {
    breaks = [1, 1]
  } else {
    low = Math.min(...breaks)
    high = Math.max(...breaks)  
    breaks = [low+1, high+2]      
  }


  return {
    servant_id: servant_id,
    star: star,
    breaks: breaks,
    broken: broken
  }

}

function calc_exps(exps_levels, pair, exp_per_card=32400) {
  let [low, high] = pair
  low = Number(low)
  high = Number(high)
  let exps = 0
  for (let i = low-1; i < high-1; i++) {
    exps += exps_levels[i]
  }
  return Math.ceil(exps/exp_per_card)

}

function calc_skill_pairs_needs(skill_needs, skill_pairs) {
  let needs = []
  for (let pair of skill_pairs) {
    need = calc_skill_needs(skill_needs, pair)
    needs.push(need)
  }
  return needs.reduce(push_items_together)
}

function calc_skill_needs(skill_needs, skill_pair) {
  let [low, high] = skill_pair
  low = Number(low)
  high = Number(high)
  let result = []
  for (let i = low-1; i <= high-2; i++) {
    result = push_items_together(result ,skill_needs[i])
  }
  return result
}
// item: [id, name, num]
function push_items_together(items_1, items_2) {
  if (items_1.length !== 0 && items_2.length === 0) {
    return push_items_together(items_2, items_1)
  } 
  let result = JSON.parse(JSON.stringify(items_2))
  outer:
  for (let j = 0; j < items_1.length; j++) {
    //console.log('j:' + j)
    for (let i = 0; i < result.length; i++) {
      //console.log('i:' + i)
      //console.log(result.length)
      if (items_1[j][0] === result[i][0]) {
        result[i][2] += items_1[j][2]
        continue outer;
      } else if (i === result.length - 1) {
        result.push(items_1[j])
        break;
      }
    }
  }

  return result
}


function bind_summation(){
  let heads = $('.flex-item.head a')
  let tbody = $('.tbl_servant tbody')
  let url = './static/json/about_ids_names/servant_ids_by_star.json'
  $.getJSON(url, function(data){
    for (let i = 0; i < heads.length; i++) {
      $(heads[i]).on('click', function(e, level_pair, skill_pair){

        let data_num = this.getAttribute('data_num')
        //console.log(data)

        let tr = $(`<tr data_num="${data_num}"></tr>`)

        let td_1 = $(`<td><img src="https://lordpmm.github.io/fgo/static/images/fgo/head/${data_num}.jpg" class="thumb servant"></td>`)

        let td_2 = $(`<td></td>`)

        // console.log(level_pair) 
        let lv_pair = level_pair? level_pair.level_pair: [1, '']
        

        let td_2_input_1 = $(`<input type="number" value="${lv_pair[0]}" min="1" max="90">`)

        let td_2_glyphicon = $(`<span class="glyphicon glyphicon-play" aria-hidden="true" style="margin: 0 2px 0 1px; left: 0"></span>`)

        let td_2_input_2 = $(`<input type="number" value="${lv_pair[1]}" min="1" max="90" data-star=0><br>`)

        if (!level_pair) {
          if (data[0].indexOf(data_num) !== -1) {
            td_2_input_2.val(65)
            td_2_input_2.attr('data-star', 0)
          } else if (data[1].indexOf(data_num) !== -1) {
            td_2_input_2.val(60)
            td_2_input_2.attr('data-star', 1)
          } else if (data[2].indexOf(data_num) !== -1) {
            td_2_input_2.val(65)
            td_2_input_2.attr('data-star', 2)
          } else if (data[3].indexOf(data_num) !== -1) {
            td_2_input_2.val(70)
            td_2_input_2.attr('data-star', 3)
          } else if (data[4].indexOf(data_num) !== -1) {
            td_2_input_2.val(80)
            td_2_input_2.attr('data-star', 4)
          } else if (data[5].indexOf(data_num) !== -1) {
            td_2_input_2.val(90)
            td_2_input_2.attr('data-star', 5)
          }          
        }

        let broken = level_pair? level_pair.broken: false
        // console.log(broken)

        let td_2_checkbox = $(`<label>broken
                                <input type="checkbox" style="position: relative; top: 3px;">   
                              </label>`)
        if (broken) {
          td_2_checkbox.find('input').attr('checked', true)
        }

        let td_2_div = $(`<div class="level-input"></div>`)
        td_2_div.append(td_2_input_1)
                .append(td_2_glyphicon)
                .append(td_2_input_2)
                .append(td_2_checkbox)

        
        td_2.append(td_2_div)


        let td_3 = $(`<td></td>`)

        // console.log(skill_pair)
        let skill_pairs = skill_pair? skill_pair.servant_skill_pairs: [[1, 10], [1, 10], [1, 10]]
        for (let i = 1; i <= 3; i++) {
          let td_3_skill_group = $(`<div class="skill-group"></div`)

          let td_3_skill_info = $(`<div class="skill-info">
            <img src="#" id="skill${i}" class="skill thumb">
            <span class="skill_name"></span>
          </div>`)


          let td_3_skill_input = $(`<div class="skill-input">
            <input type="number" value="${skill_pairs[i-1][0]}" min="1" max="10">
            <span class="glyphicon glyphicon-play" aria-hidden="true"></span>
            <input type="number" value="${skill_pairs[i-1][1]}" min="1" max="10">
          </div>`)

          td_3_skill_group.append(td_3_skill_info)
                          .append(td_3_skill_input)

          td_3.append(td_3_skill_group)

        }

        let td_4 = $(`<td></td>`)

        let td_4_delete_btn = $(`<button type="button" class="btn btn-danger delete">Delete</button>`)

        td_4_delete_btn.on('click', function(){
          let tr = $(this).parent().parent()
          let data_num = tr.attr('data_num')
          tr.remove()
          let head = $(`.flex-item.head a[data_num='${data_num}']`);
          head.show()
        })

        td_4.append(td_4_delete_btn)


        tr.append(td_1)
          .append(td_2)
          .append(td_3)
          .append(td_4)

        tbody.append(tr)

        tr.find(`input[type='checkbox']`).on('change', function(){
          if ($(this).attr('checked')) {
            $(this).removeAttr('checked')
          } else {
            $(this).attr('checked', true)
          }
        })

        tr.find(`input[type='number']`).on('focus', function(){
          $(this).select()
        })

        let url = './static/json/extra/skill/skill_names_compl.json'
        $.getJSON(url, function(data){
            let id = Number(data_num) - 1
            let [skill_names, img_names] = data[id]

            imgs = $(`tr[data_num='${data_num}'] td:eq(2) img`)
            spans = $(`tr[data_num='${data_num}'] td:eq(2) span.skill_name`)
            for (let i = 0; i < imgs.length; i++) {
              $(imgs[i]).attr('src', `https://lordpmm.github.io/fgo/static/images/mobile/images/Skill/${img_names[i]}.png`)
              $(spans[i]).text(skill_names[i])
            }

        })


        //let tr = $(`tr[data_num='${data_num}']`)
        //tr.css('display', 'table-row')
        //tr.attr('data-calc', true)
        $(this).hide()
      })
    }
  })

}

function pad(num, n) {  
  let len = num.toString().length;  
  while(len < n) {  
      num = "0" + num;  
      len++;  
  }  
  return num;  
}  

function pad_char(num, n, char, direction) {  
  let len = num.toString().length * 4.3;  
  if (direction === 'left') {
    while(len < n) {  
      num = char + num;  
      len++;  
    }    
  } else {
    while(len < n) {  
      num = num + char;  
      len++;  
    }    
  }
  return num;  
}  
