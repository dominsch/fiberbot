var inst = {wavelengths : [1,2,3]}
var text = inst.wavelengths.map((wl) => `
            <div class="option">
                <input type="radio" id="setup-${wl}" name="wl" value="${wl}" />
                <label for ="setup-${wl}">${wl}</label>
            </div>
          `).join('')

console.log(text)