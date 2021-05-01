function onSubmit() {
  $("#resultPanel").show();
  //get input
  var ageDiff = parseFloat($("#diffAge").val());
  var annualIncome = parseFloat($("#annualIncome").cleanVal());
  var salaryRate = getValueAsPercent("incrementRate");
  var lifeStylePer = getValueAsPercent("lifeStylePer");
  var ROI = getValueAsPercent("rateOfInvestment");
  var expAnnualInflation = getValueAsPercent("annualInflation");
  var yrInRetirement = parseFloat($("#yrInRetirement").val());
  var epfRate = getValueAsPercent("epfRate");
  var currentEPF = parseFloat($("#currentEPF").cleanVal());
  var currentInvestment = parseFloat($("#currentInvestment").cleanVal());

  //call calculate function
  var annualIncomeResult = FV(salaryRate, ageDiff, 0, annualIncome, null);
  var firstYrRetirementIncome = (annualIncomeResult * lifeStylePer).toFixed(0);
  var inflationAdjROR = (
    (+ROI - expAnnualInflation) /
    (1 + expAnnualInflation)
  ).toFixed(4);
  var capitalReqResult = -PV(
    inflationAdjROR,
    yrInRetirement,
    firstYrRetirementIncome,
    0,
    1
  );
  var epfFVResult = parseFloat(FV(epfRate, ageDiff, 0, currentEPF, 1));
  var epfEVac = parseFloat(
    calcProjectedEpfBal(annualIncome, epfRate, salaryRate, ageDiff)
  );
  var projectedEpfAtRetirement = epfEVac + epfFVResult;
  var investFvResult = parseFloat(FV(ROI, ageDiff, 0, currentInvestment));
  var surplusOrShortFallResult = (
    +investFvResult +
    projectedEpfAtRetirement -
    capitalReqResult
  ).toFixed(0);

  //set value display
  $("#annualIncomeFv").val($(".money").masked(annualIncomeResult));
  $("#firstYrRetirementIncome").val(
    $(".money").masked(firstYrRetirementIncome)
  );
  $("#capitalReq").val($(".money").masked(capitalReqResult));

  $("#investFvResult").val($(".money").masked(investFvResult));
  $("#epfFVResult").val($(".money").masked(epfFVResult));
  $("#epfAnnualFVcontri").val($(".money").masked(epfEVac));
  $("#epfTotalAtRetirement").val($(".money").masked(projectedEpfAtRetirement));

  $("#surplusOrShortFallResult").val(
    $(".money").masked(Math.abs(surplusOrShortFallResult))
  );

  if (surplusOrShortFallResult > 0) {
    $("#surplusOrShortFallResult").css("color", "green");
    //congratulation, you have enough money for your retirement
    $("#conclusionPositive").show();
    $("#conclusionNegative").hide();
  } else {
    $("#surplusOrShortFallResult").css("color", "red");
    //calculate how much you will need to save every year.accordion
    var conclusionValue = PMT(ROI, ageDiff, 0, -surplusOrShortFallResult);
    $("#conclusionValue").val($(".money").masked(conclusionValue));
    $("#conclusionPositive").hide();
    $("#conclusionNegative").show();
  }
}

//UI Script
function setAgeResult(values) {
  if (!values) {
    $("#minAge").val($("#age-slider-range").slider("values", 0));
    $("#maxAge").val($("#age-slider-range").slider("values", 1));
  } else {
    $("#minAge").val(values[0]);
    $("#maxAge").val(values[1]);
  }
  $("#diffAge").val($("#maxAge").val() - $("#minAge").val());
}

function setSingleRangeValue(name, value) {
  if (!value) {
    value = $("#" + name + "-slider-range").slider("value");
  }
  $("#" + name).val(value);
}

//calculation script
function FV(rate, nper, pmt, pv, type) {
  var pow = Math.pow(1 + rate, nper),
    fv;

  pv = pv || 0;
  type = type || 0;

  if (rate) {
    fv = (pmt * (1 + rate * type) * (1 - pow)) / rate - pv * pow;
  } else {
    fv = -1 * (pv + pmt * nper);
  }
  return -fv.toFixed(0);
}

function PV(rate, periods, payment, future, type) {
  // Initialize type
  var type = typeof type === "undefined" ? 0 : type;

  rate = eval(rate);
  periods = eval(periods);

  // Return present value
  if (rate === 0) {
    return -payment * periods - future;
  } else {
    var pow1 = Math.pow(1 + rate, periods);
    var frontPart = 1 - pow1;
    var frontPart2 = frontPart / rate;

    return ((frontPart2 * payment * (1 + rate * type) - future) / pow1).toFixed(
      0
    );
  }
}

function PMT(ir, np, pv, fv, type) {
  /*
   * ir   - interest rate per month
   * np   - number of periods (months)
   * pv   - present value
   * fv   - future value
   * type - when the payments are due:
   *        0: end of the period, e.g. end of month (default)
   *        1: beginning of period
   */
  var pmt, pvif;
  fv || (fv = 0);
  type || (type = 0);
  if (ir === 0) return -(pv + fv) / np;

  pvif = Math.pow(1 + ir, np).toFixed(4);
  pmt = (-ir * (pv * pvif + fv)) / (pvif - 1);

  if (type === 1) pmt /= 1 + ir;
  return -pmt.toFixed(0);
}

function calcProjectedEpfBal(annualIncome, epfRate, salaryRate, ageDiff) {
  var EPF_CONTRIBUTION_PER = 0.23;
  try {
    if (epfRate === salaryRate) {
    
      var perRate = Math.pow(1 + epfRate, ageDiff - 1).toFixed(4);
      return (annualIncome * EPF_CONTRIBUTION_PER * ageDiff * perRate).toFixed(
        0
      );
    } else {
      var aPart = Math.pow(1 + epfRate, ageDiff).toFixed(4);
      var bPart = Math.pow(1 + salaryRate, ageDiff).toFixed(4);
      var frontPart = annualIncome * EPF_CONTRIBUTION_PER;
      var middlePart = (aPart - bPart).toFixed(4);
      var bottomPart = (epfRate - salaryRate).toFixed(4);
      var lastPart = (frontPart * middlePart).toFixed(4);
      var result = lastPart / bottomPart;
      return result.toFixed(0);
    }
  } catch (e) {
    return 0;
  }
}

function processWeightReturnTable() {
  console.log("proccess table");
  var grandTotal = 0;
  var liquidTotal = 0;
  var nonLiquidTotal = 0;
  var liquidWeightSum =0;
  var liquidWeightRetSum =0;
  var grandWeight = 0;
  var grandWeightReturn= 0;


  
  var nonLiquidWeightSum =0;
  var nonLiquidWeightRetSum =0;
  var roi = [];
  var weight = [];
  var indexAMt = [];
  var weightRet = [];

  //calc subtotal and total first
  for (var i = 1; i <= 4; i++) {
    indexAMt[i] = parseFloat($("#" + AMOUNT_FIELD + i).cleanVal());
    liquidTotal += indexAMt[i];
  }

  for (var i = 5; i <= ROW_NO; i++) {
    indexAMt[i] = parseFloat($("#" + AMOUNT_FIELD + i).cleanVal());
    nonLiquidTotal += indexAMt[i];
  }

  grandTotal = liquidTotal + nonLiquidTotal;

  $("#liquidTotal").html("(RM) " + $(".money").masked(liquidTotal));
  $("#nonLiquidTotal").html("(RM) " + $(".money").masked(nonLiquidTotal));
  $("#grandTotal").html("(RM) " + $(".money").masked(grandTotal));

  //calc weight
  for (var i = 1; i <= ROW_NO; i++) {
    weight[i] = calcWeight(indexAMt[i], grandTotal);
    $("#" + WEIGHT_FIELD + i).html(toPercent(weight[i]));
  }

  //calc weightRet
  for (var i = 1; i <= ROW_NO; i++) {
    roi[i] = getValueAsPercent(ROI_FIELD + i);
    weightRet[i] = calcWeightRet(roi[i], weight[i]);
    $("#" + WEIGHT_RET_FIELD + i).html(toPercent(weightRet[i]));
  }

  
  //calc subtotal and total first
  for (var i = 1; i <= 4; i++) {
    liquidWeightSum += weight[i];
    liquidWeightRetSum += weightRet[i];
  }

$("#liquidWeightSum").html(toPercent(liquidWeightSum));
$("#liquidwWeightReturn").html(toPercent(liquidWeightRetSum));

  for (var i = 5; i <= ROW_NO; i++) {
    nonLiquidWeightSum += weight[i];
    nonLiquidWeightRetSum += weightRet[i];
  }

  $("#nonLiquidWeightSum").html(toPercent(nonLiquidWeightSum));
  $("#nonLiquidWeightReturn").html(toPercent(nonLiquidWeightRetSum));

  grandWeight = liquidWeightSum +nonLiquidWeightSum;
  grandWeightReturn= liquidWeightRetSum+ nonLiquidWeightRetSum ;

$("#grandWeight").html(toPercent(grandWeight));
$("#grandWeightReturn").html(toPercent(grandWeightReturn));


}


function calcWeight(amount, grandTotal) {
  return amount / grandTotal;
}

function calcWeightRet(roi, weight) {
  return roi * weight;
}

function getValueAsPercent(fieldName) {
  return parseFloat(toDecimalPercent($("#" + fieldName).val()));
}

function toDecimalPercent(value) {
  return (value / 100).toFixed(2);
}

function toPercent(value) {
  return (value * 100).toFixed(2);
}

//pre init Script
$(function () {
  // Restricts input for each element in the set of matched elements to the given inputFilter.
  (function ($) {
    $.fn.inputFilter = function (inputFilter) {
      return this.on(
        "input keydown keyup mousedown mouseup select contextmenu drop",
        function () {
          if (inputFilter(this.value)) {
            this.oldValue = this.value;
            this.oldSelectionStart = this.selectionStart;
            this.oldSelectionEnd = this.selectionEnd;
          } else if (this.hasOwnProperty("oldValue")) {
            this.value = this.oldValue;
            this.setSelectionRange(
              this.oldSelectionStart,
              this.oldSelectionEnd
            );
          } else {
            this.value = "";
          }
        }
      );
    };
  })(jQuery);

  $("[data-toggle=popover]").popover();

  $("input.money").mask("#,##0", {
    reverse: true,
    translation: {
      "#": {
        pattern: /-|\d/,
        recursive: true,
      },
    },
    onChange: function (value, e) {
      e.target.value = value
        .replace(/(?!^)-/g, "")
        .replace(/^,/, "")
        .replace(/^-,/, "-");
    },
  });

  $("#age-slider-range").slider({
    range: true,
    min: 10,
    max: 100,
    values: [18, 55],
    slide: function (event, ui) {
      var values = ui?.values;
      setAgeResult(values);
    },
  });

  $("#incrementRate-slider-range").slider({
    animate: "fast",
    range: false,
    min: 1,
    max: 50,
    value: 5,
    slide: function (event, ui) {
      var value = ui?.value;
      setSingleRangeValue("incrementRate", value);
    },
  });

  $("#yrInRetirement-slider-range").slider({
    min: 1,
    max: 80,
    value: 20,
    slide: function (event, ui) {
      var value = ui?.value;
      setSingleRangeValue("yrInRetirement", value);
    },
  });

  $("#lifeStylePer-slider-range").slider({
    min: 1,
    max: 100,
    value: 70,
    slide: function (event, ui) {
      var value = ui?.value;
      setSingleRangeValue("lifeStylePer", value);
    },
  });

  $("#annualInflation-slider-range").slider({
    min: 1,
    max: 8,
    value: 4,
    slide: function (event, ui) {
      var value = ui?.value;
      setSingleRangeValue("annualInflation", value);
    },
  });

  $("#rateOfInvestment-slider-range").slider({
    min: 1,
    max: 20,
    value: 6,
    slide: function (event, ui) {
      var value = ui?.value;
      setSingleRangeValue("rateOfInvestment", value);
    },
  });

  $("#epfRate-slider-range").slider({
    min: 1,
    max: 20,
    value: 6,
    slide: function (event, ui) {
      var value = ui?.value;
      setSingleRangeValue("epfRate", value);
    },
  });

  //init values
  setAgeResult();
  setSingleRangeValue("yrInRetirement");
  setSingleRangeValue("incrementRate");
  setSingleRangeValue("lifeStylePer");
  setSingleRangeValue("annualInflation");
  setSingleRangeValue("rateOfInvestment");
  setSingleRangeValue("epfRate");

  //init script for weighted calculator side
  //set input filter...and trigger onchange event for each field
  for (var i = 1; i <= ROW_NO; i++) {
    $("#" + ROI_FIELD + i)
      .change(function () {
        processWeightReturnTable();
      })
      .inputFilter(function (value) {
        return /^\d*$/.test(value);
      });

    $("#" + AMOUNT_FIELD + i).change(function () {
      processWeightReturnTable();
    });

    console.log(AMOUNT_FIELD + i);
    console.log(ROI_FIELD + i);
    console.log(WEIGHT_FIELD + i);
    console.log(WEIGHT_RET_FIELD + i);
  }

  processWeightReturnTable();
});

const ROW_NO = 6;
const ROI_FIELD = "roi";
const AMOUNT_FIELD = "amount";
const WEIGHT_FIELD = "weight";
const WEIGHT_RET_FIELD = "weightReturn";

